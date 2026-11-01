import { apiFetch } from "@/utils/apiFetch.ts";
import type { Role } from "@/stores/auth/useAuthStore.ts";

export interface ManagedUser {
    id: string;
    name: string;
    username: string | null;
    email: string;
    role: Role;
    banned: boolean;
    created_at: string;
}

/** Roles an owner can hand out; `owner` is only ever created by setup. */
export const ASSIGNABLE_ROLES = ["manager", "cashier", "viewer"] as const;

export interface UsersPage {
    users: ManagedUser[];
    next_cursor: string | null;
}

export interface NewUser {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
}

/** Minimum password length the backend accepts. */
export const MIN_PASSWORD = 8;

/** A failed users call: the HTTP status plus a message fit for the screen. */
export class UsersApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const CODE_MESSAGES: Record<string, string> = {
    USER_EXISTS: "A user with that email or username already exists.",
    SELF_CHANGE: "You can't change your own role or ban yourself.",
    LAST_OWNER: "That would leave the store without an owner.",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(path, init);
    if (response.ok) {
        return (
            response.status === 204 ? undefined : await response.json()
        ) as T;
    }
    const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
    };
    const fallback =
        response.status === 403
            ? "You don't have access to manage users."
            : response.status === 400
              ? (body.message ?? "Check the details and try again.")
              : "Something went wrong. Try again.";
    throw new UsersApiError(
        (body.code && CODE_MESSAGES[body.code]) || fallback,
        response.status,
        body.code,
    );
}

function send(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

/** Fetches one page of users, continuing from `cursor` when given. */
export function listUsers(cursor?: string | null): Promise<UsersPage> {
    const query = new URLSearchParams({ limit: "25" });
    if (cursor) query.set("cursor", cursor);
    return request(`/api/v1/users?${query.toString()}`);
}

/** Creates a user with a password; rejects with a UsersApiError. */
export function createUser(user: NewUser): Promise<ManagedUser> {
    return request("/api/v1/users", send("POST", user));
}

/** Changes a user's role, ban state or name. */
export function updateUser(
    id: string,
    patch: { role?: string; banned?: boolean; name?: string },
): Promise<ManagedUser> {
    return request(`/api/v1/users/${id}`, send("PATCH", patch));
}

/** Sets a new password for a user. */
export function resetPassword(id: string, password: string): Promise<void> {
    return request(`/api/v1/users/${id}/password`, send("POST", { password }));
}
