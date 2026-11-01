import type { Role } from "@/stores/auth/useAuthStore.ts";

/**
 * Mirror of the backend's ROLE_SCOPES (backend/src/auth/roles.ts), used only
 * to decide what to show. The backend enforces every scope.
 */
const ROLE_SCOPES: Record<Role, readonly string[]> = {
    owner: ["*"],
    manager: [
        "catalog:read",
        "catalog:write",
        "orders:read",
        "orders:write",
        "customers:read",
        "customers:write",
        "locations:read",
        "locations:write",
        "devices:read",
        "devices:write",
        "users:read",
        "dashboard:read",
        "settings:read",
        "payments:read",
        "payments:write",
        "plugins:read",
    ],
    cashier: [
        "catalog:read",
        "orders:read",
        "orders:write",
        "customers:read",
        "customers:write",
        "locations:read",
        "payments:write",
    ],
    viewer: [
        "catalog:read",
        "orders:read",
        "customers:read",
        "locations:read",
        "dashboard:read",
    ],
};

/** Whether a role holds a scope; no role holds none. */
export function roleHasScope(
    role: Role | null | undefined,
    scope: string,
): boolean {
    if (!role) return false;
    const scopes = ROLE_SCOPES[role] ?? [];
    return scopes.includes("*") || scopes.includes(scope);
}

/** Higher rank can open everything a lower rank can. */
const ROLE_RANK: Record<Role, number> = {
    viewer: 0,
    cashier: 1,
    manager: 2,
    owner: 3,
};

/** Whether the role meets a minimum; no role meets none. */
export function meetsRole(
    role: Role | null | undefined,
    minRole?: Role,
): boolean {
    if (!minRole) return true;
    if (!role) return false;
    return ROLE_RANK[role] >= ROLE_RANK[minRole];
}
