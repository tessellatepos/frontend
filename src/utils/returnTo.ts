/**
 * Accepts a `returnTo` value only when it is a same-origin relative path
 * ("/settings?x=1"). Anything else (absolute URLs, "//host", "/\host",
 * "javascript:") falls back to `fallback`.
 */
export function safeReturnTo(
    value: string | null | undefined,
    fallback: string,
): string {
    if (!value || !value.startsWith("/")) return fallback;
    if (value.startsWith("//") || value.includes("\\")) return fallback;
    if ([...value].some((ch) => ch.charCodeAt(0) < 32)) return fallback;
    try {
        const url = new URL(value, "http://same-origin.invalid");
        if (url.origin !== "http://same-origin.invalid") return fallback;
        return url.pathname + url.search + url.hash;
    } catch {
        return fallback;
    }
}
