import { apiFetch } from "@/utils/apiFetch.ts";

export interface SetupError {
    message?: string;
    code?: string;
    missing?: string[];
}

export interface SetupResult {
    ok: boolean;
    status: number;
    data: SetupError;
}

/** POSTs JSON to /api/v1/setup/<step>; network failures become status 0. */
export async function postSetup(
    step: string,
    body?: unknown,
): Promise<SetupResult> {
    try {
        const response = await apiFetch(`/api/v1/setup/${step}`, {
            method: "POST",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = (await response.json().catch(() => ({}))) as SetupError;
        return { ok: response.ok, status: response.status, data };
    } catch {
        return { ok: false, status: 0, data: {} };
    }
}

/** User-facing text for failures every step shares. */
export function commonError(result: SetupResult): string {
    if (result.status === 0) return "Could not reach the server. Try again.";
    if (result.status === 429)
        return "Too many attempts. Wait a few minutes and try again.";
    if (result.status === 400)
        return result.data.message ?? "Some of the details are invalid.";
    return result.data.message ?? `Unexpected error (${result.status}).`;
}
