import { create } from "zustand";
import { listUsers, type ManagedUser, UsersApiError } from "./api.ts";

interface UsersState {
    users: ManagedUser[];
    nextCursor: string | null;
    loading: boolean;
    error: string;
    /** Replaces the list with the first page. */
    load: () => Promise<void>;
    /** Appends the next page when there is one. */
    loadMore: () => Promise<void>;
    /** Swaps in a user the backend just returned, or adds it at the top. */
    upsert: (user: ManagedUser) => void;
}

function message(err: unknown): string {
    return err instanceof UsersApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

export const useUsersStore = create<UsersState>((set, get) => ({
    users: [],
    nextCursor: null,
    loading: false,
    error: "",
    load: async () => {
        set({ loading: true, error: "" });
        try {
            const page = await listUsers();
            set({ users: page.users, nextCursor: page.next_cursor });
        } catch (err) {
            set({ error: message(err) });
        } finally {
            set({ loading: false });
        }
    },
    loadMore: async () => {
        const { nextCursor, loading } = get();
        if (!nextCursor || loading) return;
        set({ loading: true, error: "" });
        try {
            const page = await listUsers(nextCursor);
            set((s) => ({
                users: [...s.users, ...page.users],
                nextCursor: page.next_cursor,
            }));
        } catch (err) {
            set({ error: message(err) });
        } finally {
            set({ loading: false });
        }
    },
    upsert: (user) =>
        set((s) =>
            s.users.some((u) => u.id === user.id)
                ? { users: s.users.map((u) => (u.id === user.id ? user : u)) }
                : { users: [user, ...s.users] },
        ),
}));
