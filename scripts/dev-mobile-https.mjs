import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import localtunnel from "localtunnel";

const PORT = Number(process.env.MOBILE_PORT || process.env.PORT || 3000);
const HOST = process.env.MOBILE_HOST || "0.0.0.0";
const require = createRequire(import.meta.url);

let devProcess = null;
let tunnel = null;
let shuttingDown = false;

function logInfo(message) {
  console.log(`[mobile-https] ${message}`);
}

function logError(message) {
  console.error(`[mobile-https] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      // keep retrying while Next is booting.
    }
    await sleep(delayMs);
  }
  throw new Error("Timeout: serveur non disponible.");
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    if (tunnel) {
      logInfo("Fermeture du tunnel HTTPS...");
      await tunnel.close();
      tunnel = null;
    }
  } catch (error) {
    logError(`Echec fermeture tunnel: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (devProcess && devProcess.exitCode == null) {
    logInfo("Arret du serveur Next...");
    devProcess.kill("SIGINT");
  }

  process.exit(exitCode);
}

function startDevServer() {
  const nextBin = require.resolve("next/dist/bin/next");
  const args = [nextBin, "dev", "--hostname", HOST, "--port", String(PORT)];

  // Launch Next directly with Node (more stable than spawning npm on Windows).
  return spawn(process.execPath, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      MOBILE_PORT: String(PORT),
      MOBILE_HOST: HOST,
    },
  });
}

async function main() {
  logInfo(`Demarrage Next.js en LAN sur http://${HOST}:${PORT} ...`);
  try {
    devProcess = startDevServer();
  } catch (error) {
    throw new Error(
      `Impossible de lancer le serveur Next (${error instanceof Error ? error.message : String(error)})`
    );
  }

  devProcess.on("error", (error) => {
    if (shuttingDown) return;
    logError(
      `Erreur lancement serveur (${error?.code ?? "unknown"}): ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    void shutdown(1);
  });

  devProcess.on("exit", (code) => {
    if (shuttingDown) return;
    logError(`Le serveur Next s'est arrete (code=${code ?? "null"}).`);
    void shutdown(code ?? 1);
  });

  await waitForServerReady(`http://127.0.0.1:${PORT}`);
  logInfo("Serveur local pret.");

  tunnel = await localtunnel({ port: PORT });
  const httpsUrl = tunnel.url;

  logInfo("Tunnel HTTPS actif.");
  logInfo(`URL mobile HTTPS: ${httpsUrl}`);
  logInfo("Ouvre cette URL sur ton telephone (Chrome/Firefox), puis autorise la camera.");
  logInfo("Laisse ce terminal ouvert pendant les tests.");

  tunnel.on("close", () => {
    if (shuttingDown) return;
    logError("Tunnel ferme de maniere inattendue.");
    void shutdown(1);
  });
}

process.on("SIGINT", () => {
  void shutdown(0);
});
process.on("SIGTERM", () => {
  void shutdown(0);
});
process.on("uncaughtException", (error) => {
  logError(`Erreur non geree: ${error instanceof Error ? error.message : String(error)}`);
  void shutdown(1);
});
process.on("unhandledRejection", (error) => {
  logError(`Promise rejetee: ${error instanceof Error ? error.message : String(error)}`);
  void shutdown(1);
});

main().catch((error) => {
  logError(error instanceof Error ? error.message : String(error));
  if (String(error).toLowerCase().includes("https")) {
    logInfo("Verifie aussi que le telephone ouvre bien l'URL HTTPS du tunnel, pas l'IP HTTP locale.");
  }
  void shutdown(1);
});
