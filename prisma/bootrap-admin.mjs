
const bcrypt = require("bcryptjs");
const { PrismaClient, PorteeDonnees } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const ACCESS_CONTROL_PERMISSION_CODES = [
    "role.read",
    "role.create",
    "role.update",
    "role.delete",
    "permission.read",
    "permission.create",
    "permission.update",
    "permission.delete",
    "regle_portee_role.read",
    "regle_portee_role.create",
    "regle_portee_role.update",
    "regle_portee_role.delete",
];

function getEnv(name, fallback = "") {
    const value = process.env[name];
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getBooleanEnv(name, fallback = false) {
    const value = process.env[name];
    if (typeof value !== "string") return fallback;

    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    return fallback;
}

async function ensureRequiredPermissions() {
    const permissions = await prisma.permisions.findMany({
        where: { code: { in: ACCESS_CONTROL_PERMISSION_CODES } },
        select: { id: true, code: true },
    });

    const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission.id]));
    const missing = ACCESS_CONTROL_PERMISSION_CODES.filter((code) => !permissionByCode.has(code));

    if (missing.length) {
        throw new Error(
            `Permissions manquantes: ${missing.join(", ")}. Lance d'abord \"node prisma/seed.js\".`
        );
    }

    return permissionByCode;
}

async function ensureBootstrapRole(roleName) {
    const key = roleName.trim().toLowerCase().replace(/\s+/g, "");
    const code = key.replace(/[^a-z0-9]+/g, "_");

    return prisma.role.upsert({
        where: { nom: roleName },
        update: {
            description: "Role bootstrap pour la premiere administration de l'application",
            actif: true,
            key,
            code,
        },
        create: {
            nom: roleName,
            description: "Role bootstrap pour la premiere administration de l'application",
            actif: true,
            key,
            code,
        },
        select: { id: true, nom: true },
    });
}

async function ensureBootstrapUser(login, password, resetPassword) {
    const existingUser = await prisma.utilisateur.findUnique({
        where: { login },
        select: { id: true, login: true },
    });

    if (existingUser) {
        if (resetPassword) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.utilisateur.update({
                where: { id: existingUser.id },
                data: {
                    motDePasse: hashedPassword,
                    actif: true,
                },
            });
        } else {
            await prisma.utilisateur.update({
                where: { id: existingUser.id },
                data: { actif: true },
            });
        }

        return existingUser;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return prisma.utilisateur.create({
        data: {
            login,
            motDePasse: hashedPassword,
            actif: true,
        },
        select: { id: true, login: true },
    });
}

async function ensureUserRole(utilisateurId, roleId) {
    await prisma.utilisateurRole.upsert({
        where: {
            utilisateurId_roleId: {
                utilisateurId,
                roleId,
            },
        },
        update: {},
        create: {
            utilisateurId,
            roleId,
            attribuePar: utilisateurId,
        },
    });
}

async function ensureAccessControlGrants(roleId, permissionByCode) {
    for (const code of ACCESS_CONTROL_PERMISSION_CODES) {
        const permissionId = permissionByCode.get(code);
        if (!permissionId) continue;

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId,
                },
            },
            update: {},
            create: {
                roleId,
                permissionId,
            },
        });

        await prisma.reglePorteeRole.upsert({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId,
                },
            },
            update: {
                portee: PorteeDonnees.TOUTE_ORGANISATION,
            },
            create: {
                roleId,
                permissionId,
                portee: PorteeDonnees.TOUTE_ORGANISATION,
            },
        });
    }
}

async function main() {
    const login = getEnv("BOOTSTRAP_ADMIN_LOGIN", "admin@local.test");
    const password = getEnv("BOOTSTRAP_ADMIN_PASSWORD", "Admin123456!");
    const roleName = getEnv("BOOTSTRAP_ADMIN_ROLE_NAME", "Admin Gen");
    const resetPassword = getBooleanEnv("BOOTSTRAP_ADMIN_RESET_PASSWORD", false);

    const permissionByCode = await ensureRequiredPermissions();
    const role = await ensureBootstrapRole(roleName);
    const user = await ensureBootstrapUser(login, password, resetPassword);

    await ensureUserRole(user.id, role.id);
    await ensureAccessControlGrants(role.id, permissionByCode);

    console.log("Bootstrap admin complete", {
        login: user.login,
        role: role.nom,
        permissions: ACCESS_CONTROL_PERMISSION_CODES.length,
        resetPassword,
        note: "Reconnecte-toi apres l'execution si la session etait deja ouverte.",
    });
}

main()
    .catch((error) => {
        console.error("Bootstrap admin failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });