/** Pure helpers for the credentials screens (no imports, easy to test). */

/** Splits a textarea into non-empty trimmed lines. */
export function lines(text: string): string[] {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
}

/** The status shown for a credential. */
export function credentialStatus(
    credential: {
        revoked_at?: string;
        expires_at: string | null;
    },
    now = Date.now(),
): "Revoked" | "Expired" | "Active" {
    if (credential.revoked_at) return "Revoked";
    if (credential.expires_at && Date.parse(credential.expires_at) <= now)
        return "Expired";
    return "Active";
}
