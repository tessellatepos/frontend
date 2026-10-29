import { create } from "zustand";
import { authClient } from "@/utils/authClient.ts";
import { apiFetch, onSessionLost } from "@/utils/apiFetch.ts";

export type Role = "owner" | "manager" | "cashier" | "viewer";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    role?: Role | null;
}

/** What GET /api/v1/setup/status returns. */
export interface SetupStatus {
    needsSetup: boolean;
    setupTokenRequired: boolean;
    provider: "local" | "square";
    squareConnected: boolean;
    steps: {
        owner: boolean;
        store: boolean;
        provider: boolean;
        device: boolean;
    };
}

interface AuthState {
    status: "unknown" | "signed-out" | "signed-in";
    user: AuthUser | null;
    /** Null until the first setup status has been read. */
    setupNeeded: boolean | null;
    /** The last setup status the backend returned, if any. */
    setup: SetupStatus | null;
    /** Re-reads the session and the setup status. */
    refresh: () => Promise<void>;
    signOut: () => Promise<void>;
}

/** Where a signed-in user lands from `/`; the dashboard will replace this. */
export const SIGNED_IN_HOME = "/settings";

export const useAuthStore = create<AuthState>((set) => ({
    status: "unknown",
    user: null,
    setupNeeded: null,
    setup: null,
    refresh: async () => {
        const [session, setup] = await Promise.all([
            authClient
                .getSession()
                .then((r) => r.data?.user ?? null)
                .catch(() => null),
            apiFetch("/api/v1/setup/status")
                .then((r) => (r.ok ? (r.json() as Promise<SetupStatus>) : null))
                .catch(() => null),
        ]);
        set({
            status: session ? "signed-in" : "signed-out",
            user: session as AuthUser | null,
            setupNeeded: setup ? setup.needsSetup : false,
            setup,
        });
    },
    signOut: async () => {
        try {
            await authClient.signOut();
        } finally {
            set({ status: "signed-out", user: null });
        }
    },
}));

// A 401 on an internal call means the session is gone: drop the identity and
// send the user to /login, remembering where they were.
onSessionLost(() => {
    useAuthStore.setState({ status: "signed-out", user: null });
    const { pathname, search } = window.location;
    if (pathname === "/login" || pathname === "/setup") return;
    window.location.assign(
        `/login?returnTo=${encodeURIComponent(pathname + search)}`,
    );
});
