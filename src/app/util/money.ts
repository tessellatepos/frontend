export function convertCentsToDollars(cents: bigint ): string {
    if (cents === undefined || cents === null) return "0.00";
    const negative = cents < 0n;
    const abs = negative ? -cents : cents;
    const s = abs.toString();
    const centsPart = s.slice(-2).padStart(2, "0");
    const dollarsPart = s.slice(0, -2) || "0";
    return `${negative ? "-" : ""}${dollarsPart}.${centsPart}`;
}