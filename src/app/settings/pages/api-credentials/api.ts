import type {
    ApiCredential,
    ApiCredentialInput,
    ApiCredentialSecret,
} from "@tessellatepos/sdk";
import { apiFetch } from "@/utils/apiFetch.ts";

export { CORE_SCOPES } from "@tessellatepos/sdk";
export type { ApiCredential, ApiCredentialInput, ApiCredentialSecret };

/** A failed credentials call: the HTTP status plus a message for the screen. */
export class CredentialsApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/** One outbound webhook attempt as the delivery log shows it. */
export interface WebhookDelivery {
    id: string;
    event_id: string;
    type: string;
    status: "pending" | "delivered" | "failed";
    attempts: number;
    last_status_code: number | null;
    last_error: string | null;
    replay_of: string | null;
    created_at: string;
    delivered_at: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(`/api/v1/credentials${path}`, init);
    if (response.ok) return (await response.json()) as T;
    const body = (await response.json().catch(() => ({}))) as {
        message?: string;
    };
    throw new CredentialsApiError(
        response.status === 403
            ? "You don't have access to manage API credentials."
            : (body.message ?? `Request failed (${response.status}).`),
        response.status,
    );
}

function json(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

export const listCredentials = () => request<ApiCredential[]>("");

export const createCredential = (input: ApiCredentialInput) =>
    request<ApiCredentialSecret>("", json("POST", input));

/** The old secret keeps working for `overlapSeconds` (0 ends it at once). */
export const rotateSecret = (id: string, overlapSeconds: number) =>
    request<ApiCredentialSecret>(
        `/${encodeURIComponent(id)}/rotate`,
        json("POST", { overlap_seconds: overlapSeconds }),
    );

export const revokeCredential = (id: string) =>
    request<ApiCredential>(
        `/${encodeURIComponent(id)}/revoke`,
        json("POST", {}),
    );

export const listDeliveries = (id: string) =>
    request<WebhookDelivery[]>(`/${encodeURIComponent(id)}/deliveries`);

export const replayDelivery = (id: string, deliveryId: string) =>
    request<{ id: string }>(
        `/${encodeURIComponent(id)}/deliveries/${encodeURIComponent(deliveryId)}/replay`,
        json("POST", {}),
    );

/** Overlap choices offered when rotating a secret. */
export const OVERLAPS = [
    { seconds: 0, label: "Replace now (old secret stops at once)" },
    { seconds: 3600, label: "Keep the old secret for 1 hour" },
    { seconds: 86400, label: "Keep the old secret for 24 hours" },
] as const;
