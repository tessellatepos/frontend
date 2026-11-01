import type { Money } from "@/stores/dashboard/useDashboardStore.ts";

/** Formats minor units in the money's currency (e.g. "350" CAD -> $3.50). */
export function formatMoney(money: Money | null | undefined): string {
    if (!money) return "—";
    try {
        const fmt = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: money.currency,
        });
        const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
        return fmt.format(Number(money.amount) / 10 ** digits);
    } catch {
        return `${money.amount} ${money.currency}`;
    }
}
