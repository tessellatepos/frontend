type MoneyAmount = bigint | string | number | null | undefined;

/**
 * Money amounts round-trip through JSON as strings (the backend serializes
 * bigints with a custom replacer), so values typed as `bigint` are often
 * actually strings by the time they reach the frontend. Coerce defensively.
 */
export function toBigIntAmount(amount: MoneyAmount): bigint {
    if (typeof amount === "bigint") return amount;
    if (amount === undefined || amount === null) return 0n;
    return BigInt(amount);
}

export function convertCentsToDollars(cents: MoneyAmount): string {
    const amount = toBigIntAmount(cents);
    const negative = amount < 0n;
    const abs = negative ? -amount : amount;
    const s = abs.toString();
    const centsPart = s.slice(-2).padStart(2, "0");
    const dollarsPart = s.slice(0, -2) || "0";
    return `${negative ? "-" : ""}${dollarsPart}.${centsPart}`;
}
