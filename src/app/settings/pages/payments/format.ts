/** Pure helpers for the Payments screens (no imports, easy to test). */

export interface ConfigField {
    key: string;
    label: string;
    hint: string;
}

/**
 * Keys a processor reads, by processor id. The server accepts any key and
 * never lists the ones a processor understands, so the screen knows Square's.
 */
const KNOWN_FIELDS: Record<string, ConfigField[]> = {
    square: [
        {
            key: "webhookSignatureKey",
            label: "Webhook signature key",
            hint: "From the Square Developer Dashboard, on the webhook subscription.",
        },
        {
            key: "squareLocationId",
            label: "Square location ID",
            hint: "Leave empty to use this location's own Square location.",
        },
    ],
};

/** The fields to offer for a processor; unknown ones show the keys they hold. */
export function configFields(
    processorId: string,
    configuredKeys: string[],
): ConfigField[] {
    return (
        KNOWN_FIELDS[processorId] ??
        configuredKeys.map((key) => ({ key, label: key, hint: "" }))
    );
}

/** Only the typed values, trimmed: untouched fields are never sent. */
export function changedConfig(
    drafts: Record<string, string>,
): Record<string, string> {
    const changed: Record<string, string> = {};
    for (const [key, value] of Object.entries(drafts)) {
        if (value.trim()) changed[key] = value.trim();
    }
    return changed;
}

const PAYMENT_LABELS: Record<string, string> = {
    unpaid: "Unpaid",
    processing: "Processing",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
};

/** Display text for a derived payment status or an attempt/invoice status. */
export function statusLabel(status: string): string {
    return (
        PAYMENT_LABELS[status] ??
        status.charAt(0).toUpperCase() + status.slice(1)
    );
}

/** YYYY-MM-DD, `days` after `now` in local time (an invoice's default due date). */
export function defaultDueDate(now: Date, days: number): string {
    const due = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    due.setDate(due.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
}

/** Invoice states in which the invoice can still be paid or canceled. */
export function invoiceIsOpen(status: string): boolean {
    return ["draft", "sent", "viewed", "overdue"].includes(status);
}
