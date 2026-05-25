import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { join } from "node:path";
import process from "node:process";
import localtunnel from "localtunnel";

const PORT = Number(process.env.MOBILE_PORT || process.env.PORT || 3000);
const HOST = process.env.MOBILE_HOST || "0.0.0.0";
const TUNNEL_HOST = process.env.MOBILE_TUNNEL_HOST || "https://loca.lt";
const TUNNEL_RETRY_DELAY_MS = Number(process.env.MOBILE_TUNNEL_RETRY_DELAY_MS || 3000);
const TUNNEL_HEALTH_INTERVAL_MS = Number(process.env.MOBILE_TUNNEL_HEALTH_INTERVAL_MS || 15000);
const AUTO_BUILD_ON_START = process.env.MOBILE_AUTO_BUILD_ON_START !== "0";
const require = createRequire(import.meta.url);
const NEXT_BIN = require.resolve("next/dist/bin/next");
const NEXT_MODE = resolveNextMode();
const TUNNEL_SUBDOMAIN = resolveTunnelSubdomain();

let devProcess = null;
let tunnel = null;
let shuttingDown = false;
let reconnectingTunnel = false;
let tunnelAttempt = 0;
let tunnelHealthTimer = null;
let currentTunnelUrl = null;

function resolveNextMode() {
  const modeFromArgs = readCliOption("mode");
  const rawMode = (modeFromArgs || process.env.MOBILE_NEXT_MODE || "dev").toLowerCase();
  if (rawMode === "start" || rawMode === "prod" || rawMode === "production") {
    return "start";
  }
  return "dev";
}

function readCliOption(name) {
  const fullOption = `--${name}`;
  const withValuePrefix = `${fullOption}=`;
  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index];
    if (argument.startsWith(withValuePrefix)) {
      return argument.slice(withValuePrefix.length).trim();
    }
    if (argument === fullOption && process.argv[index + 1]) {
      return String(process.argv[index + 1]).trim();
    }
  }
  return "";
}

function sanitizeSubdomain(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const nonEmpty = normalized || "rtnc-rh-mobile";
  const withPrefix = /^[a-z]/.test(nonEmpty) ? nonEmpty : `rtnc-${nonEmpty}`;
  return withPrefix.slice(0, 63);
}

function getDefaultTunnelSubdomain() {
  let projectName = "rtnc-rh";
  try {
    const pkg = require(join(process.cwd(), "package.json"));
    if (pkg?.name) {
      projectName = String(pkg.name);
    }
  } catch {
    // Keep fallback project name.
  }

  const hostName = os.hostname() || "local";
  return sanitizeSubdomain(`${projectName}-${hostName}`);
}

function resolveTunnelSubdomain() {
  const cliValue = readCliOption("subdomain");
  const envValue = process.env.MOBILE_TUNNEL_SUBDOMAIN || "";
  const finalValue = cliValue || envValue || getDefaultTunnelSubdomain();
  return sanitizeSubdomain(finalValue);
}

function logInfo(message) {
  console.log(`[mobile-https] ${message}`);
}

function logError(message) {
  console.error(`[mobile-https] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getNextEnv() {
  const env = {
    ...process.env,
    MOBILE_PORT: String(PORT),
    MOBILE_HOST: HOST,
  };

  if (NEXT_MODE === "start") {
    env.NODE_ENV = "production";
  }

  return env;
}

function spawnNextCommand(command, args = []) {
  return spawn(process.execPath, [NEXT_BIN, command, ...args], {
    stdio: "inherit",
    env: getNextEnv(),
  });
}

async function runNextCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawnNextCommand(command, args);

    child.on("error", (error) => {
      reject(new Error(`Erreur lancement next ${command}: ${formatError(error)}`));
    });

    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function ensureProductionBuild() {
  if (NEXT_MODE !== "start") return;

  const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
  if (existsSync(buildIdPath)) {
    logInfo("Build production detecte (.next/BUILD_ID).");
    return;
  }

  if (!AUTO_BUILD_ON_START) {
    throw new Error("Aucun build production detecte. Lance `npm run build` puis recommence.");
  }

  logInfo("Aucun build production detecte. Lancement de `next build`...");
  const buildExitCode = await runNextCommand("build");
  if (buildExitCode !== 0) {
    throw new Error("Echec de `next build`.");
  }
  logInfo("Build production termine.");
}

function clearTunnelHealthMonitor() {
  if (!tunnelHealthTimer) return;
  clearInterval(tunnelHealthTimer);
  tunnelHealthTimer = null;
}

function startTunnelHealthMonitor(httpsUrl) {
  clearTunnelHealthMonitor();
  tunnelHealthTimer = setInterval(async () => {
    if (shuttingDown || !tunnel) return;
    try {
      const response = await fetch(httpsUrl, { method: "GET" });
      if (response.status >= 500) {
        logError(`Tunnel repond ${response.status}. Reconnexion automatique...`);
        void ensureTunnel("health-check");
      }
    } catch {
      // Ignore transient network failures; close event generally handles hard failures.
    }
  }, TUNNEL_HEALTH_INTERVAL_MS);
}

async function waitForServerReady(url, maxAttempts = 90, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (devProcess?.exitCode != null) {
      throw new Error("Le serveur Next s'est arrete avant d'etre pret.");
    }

    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // Keep retrying while Next is booting.
    }
    await sleep(delayMs);
  }
  throw new Error("Timeout: serveur non disponible.");
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTunnelHealthMonitor();

  try {
    if (tunnel) {
      logInfo("Fermeture du tunnel HTTPS...");
      await tunnel.close();
      tunnel = null;
      currentTunnelUrl = null;
    }
  } catch (error) {
    logError(`Echec fermeture tunnel: ${formatError(error)}`);
  }

  if (devProcess && devProcess.exitCode == null) {
    logInfo("Arret du serveur Next...");
    devProcess.kill("SIGINT");
  }

  process.exit(exitCode);
}

function startNextServer() {
  const command = NEXT_MODE === "start" ? "start" : "dev";
  const args = ["--hostname", HOST, "--port", String(PORT)];

  // Launch Next directly with Node (more stable than spawning npm on Windows).
  return spawnNextCommand(command, args);
}

async function ensureTunnel(reason = "initialisation") {
  if (shuttingDown || reconnectingTunnel) return;

  reconnectingTunnel = true;
  clearTunnelHealthMonitor();
  const previousUrl = currentTunnelUrl;
  try {
    if (tunnel) {
      try {
        await tunnel.close();
      } catch {
        // Ignore close failures while reconnecting.
      }
      tunnel = null;
      currentTunnelUrl = null;
    }

    while (!shuttingDown) {
      tunnelAttempt += 1;
      try {
        logInfo(
          `Ouverture tunnel HTTPS (${reason}, tentative ${tunnelAttempt}) via ${TUNNEL_HOST}...`
        );
        tunnel = await localtunnel({
          port: PORT,
          host: TUNNEL_HOST,
          local_host: "127.0.0.1",
          ...(TUNNEL_SUBDOMAIN ? { subdomain: TUNNEL_SUBDOMAIN } : {}),
        });

        const httpsUrl = tunnel.url;
        currentTunnelUrl = httpsUrl;
        logInfo("Tunnel HTTPS actif.");
        logInfo(`Sous-domaine fixe: ${TUNNEL_SUBDOMAIN}`);
        logInfo(`URL mobile HTTPS: ${httpsUrl}`);
        if (previousUrl && previousUrl !== httpsUrl) {
          logInfo(`L'ancienne URL n'est plus valide. Utilise maintenant: ${httpsUrl}`);
        }
        logInfo("Ouvre cette URL sur ton telephone (Chrome/Firefox), puis autorise la camera.");
        logInfo("Laisse ce terminal ouvert pendant les tests.");
        logInfo("Tu garderas cette meme URL aux prochains lancements (tant que le sous-domaine reste disponible).");

        startTunnelHealthMonitor(httpsUrl);
        tunnel.on("close", () => {
          if (shuttingDown) return;
          logError("Tunnel ferme de maniere inattendue. Reconnexion automatique...");
          tunnel = null;
          void ensureTunnel("reconnexion");
        });

        return;
      } catch (error) {
        const errorMessage = formatError(error);
        if (TUNNEL_SUBDOMAIN && /taken|already.*use|unavailable|forbidden|exists/i.test(errorMessage)) {
          throw new Error(
            `Le sous-domaine '${TUNNEL_SUBDOMAIN}' est indisponible. Choisis-en un autre avec --subdomain=mon-sous-domaine.`
          );
        }
        logError(
          `Echec tunnel: ${errorMessage}. Nouvelle tentative dans ${TUNNEL_RETRY_DELAY_MS / 1000}s...`
        );
        await sleep(TUNNEL_RETRY_DELAY_MS);
      }
    }
  } finally {
    reconnectingTunnel = false;
  }
}

async function main() {
  logInfo(
    `Mode Next.js: ${
      NEXT_MODE === "start" ? "start (production)" : "dev (developpement)"
    }.`
  );

  await ensureProductionBuild();

  logInfo(`Demarrage Next.js en LAN sur http://${HOST}:${PORT} ...`);
  try {
    devProcess = startNextServer();
  } catch (error) {
    throw new Error(`Impossible de lancer le serveur Next (${formatError(error)})`);
  }

  devProcess.on("error", (error) => {
    if (shuttingDown) return;
    logError(`Erreur lancement serveur (${error?.code ?? "unknown"}): ${formatError(error)}`);
    void shutdown(1);
  });

  devProcess.on("exit", (code) => {
    if (shuttingDown) return;
    logError(`Le serveur Next s'est arrete (code=${code ?? "null"}).`);
    void shutdown(code ?? 1);
  });

  await waitForServerReady(`http://127.0.0.1:${PORT}`);
  logInfo("Serveur local pret.");
  await ensureTunnel("initialisation");
}

process.on("SIGINT", () => {
  void shutdown(0);
});
process.on("SIGTERM", () => {
  void shutdown(0);
});
process.on("uncaughtException", (error) => {
  logError(`Erreur non geree: ${formatError(error)}`);
  void shutdown(1);
});
process.on("unhandledRejection", (error) => {
  logError(`Promise rejetee: ${formatError(error)}`);
  void shutdown(1);
});

main().catch((error) => {
  logError(formatError(error));
  if (String(error).toLowerCase().includes("https")) {
    logInfo("Verifie aussi que le telephone ouvre bien l'URL HTTPS du tunnel, pas l'IP HTTP locale.");
  }
  void shutdown(1);
});
