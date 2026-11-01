import { apiFetch } from "@/utils/apiFetch.ts";

/** A failed payments call: the HTTP status plus a message for the screen. */
export class PaymentsApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

/** One processor as it stands at one location. Key values are never sent. */
export interface ProcessorStatus {
    id: string;
    label: string;
    capabilities: { checkout: boolean; invoice: boolean };
    enabled: boolean;
    configured: boolean;
    configured_keys: string[];
    webhook_url: string | null;
}

export interface PaymentsStatus {
    online_payments_available: boolean;
    public_url: string | null;
}

/** Reads a JSON answer, turning a refusal into a PaymentsApiError. */
export async function paymentsRequest<T>(
    path: string,
    init?: RequestInit,
): Promise<T> {
    const response = await apiFetch(`/api/v1/payments${path}`, init);
    if (response.ok) return (await response.json()) as T;
    const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
    };
    throw new PaymentsApiError(
        body.message ??
            (response.status === 403
                ? "You don't have access to payment settings."
                : `Request failed (${response.status}).`),
        response.status,
        body.code,
    );
}

export function paymentsJson(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

/** The message to show for any failure, including an unreachable server. */
export function failureMessage(err: unknown): string {
    return err instanceof PaymentsApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

export const getPaymentsStatus = () =>
    paymentsRequest<PaymentsStatus>("/status");

export const listProcessors = (locationId: string) =>
    paymentsRequest<ProcessorStatus[]>(
        `/processors?location_id=${encodeURIComponent(locationId)}`,
    );

/** Sends only what changed; config values are merged over the stored ones. */
export const updateProcessor = (
    processorId: string,
    locationId: string,
    change: { enabled?: boolean; config?: Record<string, string> },
) =>
    paymentsRequest<ProcessorStatus>(
        `/processors/${encodeURIComponent(processorId)}/locations/${encodeURIComponent(locationId)}`,
        paymentsJson("PUT", change),
    );
