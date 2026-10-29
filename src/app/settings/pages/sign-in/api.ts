import { apiFetch } from "@/utils/apiFetch.ts";

export type ProviderKind = "oidc" | "oauth" | "social" | "custom";

/** An owner-visible sign-in method; the secret itself is never returned. */
export interface AuthProviderView {
    id: string;
    label: string;
    kind: ProviderKind;
    plugin: string;
    enabled: boolean;
    configured: boolean;
    fields: {
        discoveryUrl?: string;
        clientId?: string;
        hasSecret: boolean;
    };
}

export interface ProviderUpdate {
    enabled?: boolean;
    discoveryUrl?: string;
    clientId?: string;
    /** Write-only; omit to keep the stored secret. */
    clientSecret?: string;
    scopes?: string[];
}

/** Lists every provider plugins contribute, with owner-visible settings. */
export async function listProviders(): Promise<AuthProviderView[]> {
    const response = await apiFetch("/api/v1/auth-providers");
    if (!response.ok) throw new Error(`providers returned ${response.status}`);
    return (await response.json()) as AuthProviderView[];
}

/** Saves a provider's settings and returns the updated view. */
export async function saveProvider(
    id: string,
    update: ProviderUpdate,
): Promise<AuthProviderView> {
    const response = await apiFetch(
        `/api/v1/auth-providers/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
        },
    );
    if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
            message?: string;
        };
        throw new Error(body.message ?? `save returned ${response.status}`);
    }
    return (await response.json()) as AuthProviderView;
}
