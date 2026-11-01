import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, Settings } from "lucide-react";
import type { Role } from "@/stores/auth/useAuthStore.ts";

export interface NavEntry {
    name: string;
    to: string;
    icon: LucideIcon;
    /** Shown only to roles holding this scope. */
    scope: string;
    /** Stricter than the scope when the target page is itself role-gated. */
    minRole?: Role;
}

/**
 * Primary work areas only. Administration (Storefronts, Devices, Providers,
 * Users, Sign-in methods, General, Appearance) lives in the Settings tabs.
 * Plugin PAGE mounts are appended by AppLayout.
 */
export const NAV_ENTRIES: NavEntry[] = [
    {
        name: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        scope: "dashboard:read",
    },
    {
        name: "Catalog",
        to: "/catalog",
        icon: BookOpen,
        scope: "catalog:read",
        minRole: "manager",
    },
    {
        name: "Settings",
        to: "/settings",
        icon: Settings,
        // Every signed-in role can open General and Appearance.
        scope: "",
    },
];
