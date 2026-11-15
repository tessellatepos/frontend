import { create } from "zustand";
import {
    listMembers,
    type Member,
    type MemberFilter,
    MembersApiError,
} from "./api.ts";

interface MembersState {
    members: Member[];
    nextCursor: string | null;
    loading: boolean;
    error: string;
    /** Replaces the list with the first page for a filter. */
    load: (filter: MemberFilter) => Promise<void>;
    /** Appends the next page when there is one. */
    loadMore: (filter: MemberFilter) => Promise<void>;
    /** Swaps in a member the backend just returned. */
    upsert: (member: Member) => void;
    remove: (id: string) => void;
}

function message(err: unknown): string {
    return err instanceof MembersApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

export const useMembersStore = create<MembersState>((set, get) => ({
    members: [],
    nextCursor: null,
    loading: false,
    error: "",
    load: async (filter) => {
        set({ loading: true, error: "" });
        try {
            const page = await listMembers(filter);
            set({ members: page.members, nextCursor: page.next_cursor });
        } catch (err) {
            set({ error: message(err) });
        } finally {
            set({ loading: false });
        }
    },
    loadMore: async (filter) => {
        const { nextCursor, loading } = get();
        if (!nextCursor || loading) return;
        set({ loading: true, error: "" });
        try {
            const page = await listMembers(filter, nextCursor);
            set((s) => ({
                members: [...s.members, ...page.members],
                nextCursor: page.next_cursor,
            }));
        } catch (err) {
            set({ error: message(err) });
        } finally {
            set({ loading: false });
        }
    },
    upsert: (member) =>
        set((s) => ({
            members: s.members.map((m) => (m.id === member.id ? member : m)),
        })),
    remove: (id) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
}));
