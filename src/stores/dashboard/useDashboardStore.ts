import { create } from "zustand";
import { apiFetch } from "@/utils/apiFetch.ts";

export interface Money {
    amount: string;
    currency: string;
}

export interface DashboardSummary {
    from: string;
    to: string;
    locations: {
        locationId: string;
        currency: string;
        salesTotal: Money;
        orderCount: number;
        averageOrder: Money;
    }[];
    totals: {
        currency: string;
        salesTotal: Money;
        orderCount: number;
        averageOrder: Money;
    } | null;
    paymentMethods: {
        type: string;
        currency: string;
        count: number;
        total: Money;
    }[];
    openOrders: number;
    recentOrders: {
        referenceId: string;
        locationId: string;
        source: string | null;
        state: string | null;
        totalMoney: Money | null;
        createdAt: string | null;
    }[];
    health: {
        provider: { id: string; connected: boolean };
        catalogLastSyncedAt: string | null;
        devicesPaired: number;
        pluginsLoaded: number;
    };
}

export interface DashboardLocation {
    id: string;
    name: string;
}

interface DashboardState {
    summary: DashboardSummary | null;
    locations: DashboardLocation[];
    /** "" means all locations. */
    locationId: string;
    /** More than one user exists; null until known or not allowed to know. */
    hasInvitedUser: boolean | null;
    status: "idle" | "loading" | "error";
    /** Reads the remembered location for this user. */
    restoreLocation: (userId: string) => void;
    setLocation: (userId: string, locationId: string) => void;
    load: (canListUsers: boolean) => Promise<void>;
}

const storageKey = (userId: string) =>
    `tessellate.dashboard.location.${userId}`;

function remembered(userId: string): string {
    try {
        return localStorage.getItem(storageKey(userId)) ?? "";
    } catch {
        return "";
    }
}

function remember(userId: string, locationId: string): void {
    try {
        if (locationId) localStorage.setItem(storageKey(userId), locationId);
        else localStorage.removeItem(storageKey(userId));
    } catch {
        // Storage can be unavailable (private mode, blocked site data).
    }
}

// Orders live here, not in the cart/order stores, which belong to the till.
export const useDashboardStore = create<DashboardState>((set, get) => ({
    summary: null,
    locations: [],
    locationId: "",
    hasInvitedUser: null,
    status: "idle",
    restoreLocation: (userId) => set({ locationId: remembered(userId) }),
    setLocation: (userId, locationId) => {
        remember(userId, locationId);
        set({ locationId });
    },
    load: async (canListUsers) => {
        set({ status: "loading" });
        try {
            const locationsRes = await apiFetch("/api/v1/locations");
            const locations = locationsRes.ok
                ? ((await locationsRes.json()) as DashboardLocation[])
                : [];
            // A remembered location that no longer exists falls back to all.
            let { locationId } = get();
            if (locationId && !locations.some((l) => l.id === locationId)) {
                locationId = "";
            }
            const query = locationId
                ? `?locationId=${encodeURIComponent(locationId)}`
                : "";
            const [summaryRes, usersRes] = await Promise.all([
                apiFetch(`/api/v1/dashboard/summary${query}`),
                canListUsers ? apiFetch("/api/v1/users?limit=2") : null,
            ]);
            if (!summaryRes.ok) throw new Error(`summary ${summaryRes.status}`);
            const summary = (await summaryRes.json()) as DashboardSummary;
            let hasInvitedUser: boolean | null = null;
            if (usersRes?.ok) {
                const { users } = (await usersRes.json()) as {
                    users: unknown[];
                };
                hasInvitedUser = users.length > 1;
            }
            set({
                summary,
                locations,
                locationId,
                hasInvitedUser,
                status: "idle",
            });
        } catch (err) {
            console.error("Loading the dashboard failed", err);
            set({ status: "error" });
        }
    },
}));
