import type {
    Member,
    MemberPage,
    MemberPatch,
    MemberSignupPolicy,
    MemberStatus,
} from "@tessellatepos/sdk";
import { apiFetch } from "@/utils/apiFetch.ts";

export type { Member, MemberSignupPolicy, MemberStatus };

/** A failed members call: the HTTP status plus a message fit for the screen. */
export class MembersApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(path, init);
    if (response.ok) {
        return (
            response.status === 204 ? undefined : await response.json()
        ) as T;
    }
    const body = (await response.json().catch(() => ({}))) as {
        message?: string;
    };
    throw new MembersApiError(
        response.status === 403
            ? "You don't have access to do that."
            : response.status === 400
              ? (body.message ?? "Check the details and try again.")
              : response.status === 404
                ? "That member no longer exists."
                : "Something went wrong. Try again.",
        response.status,
    );
}

function send(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

export interface MemberFilter {
    text?: string;
    plugin?: string;
    status?: MemberStatus;
}

/** Fetches one page of members, continuing from `cursor` when given. */
export function listMembers(
    filter: MemberFilter,
    cursor?: string | null,
): Promise<MemberPage> {
    const query = new URLSearchParams({ limit: "25" });
    if (filter.text) query.set("text", filter.text);
    if (filter.plugin) query.set("plugin", filter.plugin);
    if (filter.status) query.set("status", filter.status);
    if (cursor) query.set("cursor", cursor);
    return request(`/api/v1/members?${query.toString()}`);
}

/** Approves, disables, renames or links a member. */
export function updateMember(id: string, patch: MemberPatch): Promise<Member> {
    return request(
        `/api/v1/members/${encodeURIComponent(id)}`,
        send("PATCH", patch),
    );
}

/** Deletes a member and everything the host holds about them. */
export function deleteMember(id: string): Promise<void> {
    return request(`/api/v1/members/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
}

/** Everything the host holds about one member, for a data request. */
export function exportMember(id: string): Promise<{ member: Member }> {
    return request(`/api/v1/members/${encodeURIComponent(id)}/export`);
}

/** An owner-visible member login; the secret itself is never returned. */
export interface MemberSourceView {
    plugin: string;
    id: string;
    label: string;
    enabled: boolean;
    configured: boolean;
    signup: MemberSignupPolicy;
    signupOverridden: boolean;
    fields: { clientId?: string; hasSecret: boolean };
}

export interface MemberSourceUpdate {
    enabled?: boolean;
    /** null goes back to the plugin's own choice. */
    signup?: MemberSignupPolicy | null;
    clientId?: string;
    /** Write-only; omit to keep the stored secret. */
    clientSecret?: string;
}

/** Lists every member login plugins contribute. */
export async function listMemberSources(): Promise<MemberSourceView[]> {
    const body = await request<{ sources: MemberSourceView[] }>(
        "/api/v1/members/sources",
    );
    return body.sources;
}

/** Saves a member login's settings and returns the updated view. */
export function saveMemberSource(
    plugin: string,
    id: string,
    update: MemberSourceUpdate,
): Promise<MemberSourceView> {
    return request(
        `/api/v1/members/sources/${encodeURIComponent(plugin)}/${encodeURIComponent(id)}`,
        send("PUT", update),
    );
}

/** The URL to register at the identity provider for a login. */
export function memberRedirectUrl(plugin: string, id: string): string {
    return `${window.location.origin}/member/${encodeURIComponent(plugin)}/auth/${encodeURIComponent(id)}/callback`;
}
