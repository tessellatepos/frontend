/** Pure helpers for the online orders screens. */

/** A customer's name for a list, falling back to company, email, then id. */
export function customerLabel(customer: {
    id: string;
    given_name?: string;
    family_name?: string;
    company_name?: string;
    email?: string;
}): string {
    const name = [customer.given_name, customer.family_name]
        .filter(Boolean)
        .join(" ");
    return name || customer.company_name || customer.email || customer.id;
}

/** What the invoice delivery method needs from the customer, or "" if nothing. */
export function deliveryNeed(
    delivery: "EMAIL" | "SMS" | "SHARE_MANUALLY",
): string {
    if (delivery === "EMAIL") return "an email address";
    if (delivery === "SMS") return "a phone number";
    return "";
}

/** A short form of an order reference for lists. */
export function shortReference(reference: string): string {
    return reference.length > 10 ? `${reference.slice(0, 8)}…` : reference;
}
