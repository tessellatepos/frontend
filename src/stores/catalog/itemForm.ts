import {
    convertCentsToDollars,
    convertDollarsToCents,
} from "@tessellatepos/sdk";
import type {
    CatalogFieldError,
    Item,
    ItemInput,
    ItemVariationInput,
} from "@tessellatepos/sdk";

export interface VariationForm {
    /** Stable React key; never sent. */
    key: string;
    /** Set for a variation that already exists. */
    id?: string;
    name: string;
    sku: string;
    upc: string;
    pricingType: "FIXED" | "VARIABLE";
    /** Dollars as typed, e.g. "4.50". */
    price: string;
    trackInventory: boolean;
    /** Typed override price per storefront id; empty means no override. */
    overrides: Record<string, string>;
}

export interface ItemForm {
    name: string;
    displayName: string;
    labelColor: string;
    isTaxable: boolean;
    image: string;
    currency: string;
    categoryIds: string[];
    locationIds: string[];
    variations: VariationForm[];
}

/** Field-path (as the form names them) to message. */
export type FormErrors = Record<string, string>;

// Mirrors the backend's limits in catalogValidation.ts.
const MAX_NAME = 255;
const MAX_SKU = 64;
const MAX_VARIATIONS = 100;
const MAX_AMOUNT = 999_999_999_999n;

export function newVariation(): VariationForm {
    return {
        key: crypto.randomUUID(),
        name: "",
        sku: "",
        upc: "",
        pricingType: "FIXED",
        price: "",
        trackInventory: false,
        overrides: {},
    };
}

export function emptyForm(currency: string): ItemForm {
    return {
        name: "",
        displayName: "",
        labelColor: "",
        isTaxable: true,
        image: "",
        currency,
        categoryIds: [],
        locationIds: [],
        variations: [{ ...newVariation(), name: "Regular" }],
    };
}

/**
 * Builds the editable form from a stored item.
 * @param item the item as the backend returned it
 * @param fallbackCurrency used when no variation carries a price
 * @returns the form
 */
export function formFromItem(item: Item, fallbackCurrency: string): ItemForm {
    const variations = item.variations ?? [];
    const priced = variations.find((v) => v.priceMoney)?.priceMoney;
    return {
        name: item.name ?? "",
        displayName: item.displayName ?? "",
        labelColor: item.labelColor ?? "",
        isTaxable: item.isTaxable ?? true,
        image: item.image ?? "",
        currency: priced?.currency ?? fallbackCurrency,
        categoryIds: (item.categories ?? []).flatMap((c) =>
            c.id ? [c.id] : [],
        ),
        locationIds: item.locationIds ?? [],
        variations: variations.map((v) => ({
            key: crypto.randomUUID(),
            id: v.id ?? v.itemId ?? undefined,
            name: v.name ?? "",
            sku: v.sku ?? "",
            upc: v.upc ?? "",
            pricingType: v.pricingType ?? "FIXED",
            price: v.priceMoney
                ? convertCentsToDollars(v.priceMoney.amount)
                : "",
            trackInventory: v.trackInventory ?? false,
            overrides: Object.fromEntries(
                (v.locationOverrides ?? []).flatMap((o) =>
                    o.locationId && o.priceMoney
                        ? [
                              [
                                  o.locationId,
                                  convertCentsToDollars(o.priceMoney.amount),
                              ],
                          ]
                        : [],
                ),
            ),
        })),
    };
}

function priceProblem(text: string): string {
    const cents = convertDollarsToCents(text);
    if (cents === null) return "Enter an amount like 4.50.";
    if (cents > MAX_AMOUNT) return "That amount is too large.";
    return "";
}

/**
 * Checks the form with the same rules the backend applies, so most mistakes
 * show before a request is sent. The backend stays the authority.
 * @param form the form
 * @returns messages keyed by field; empty when the form is valid
 */
export function validateForm(form: ItemForm): FormErrors {
    const errors: FormErrors = {};
    const name = form.name.trim();
    if (!name) errors.name = "Enter a name.";
    else if (name.length > MAX_NAME) {
        errors.name = `Use at most ${MAX_NAME} characters.`;
    }
    if (form.displayName.trim().length > MAX_NAME) {
        errors.displayName = `Use at most ${MAX_NAME} characters.`;
    }
    if (form.labelColor && !/^#[0-9a-fA-F]{6}$/.test(form.labelColor)) {
        errors.labelColor = "Use a colour like #1a2b3c.";
    }
    if (form.image.trim()) {
        try {
            const url = new URL(form.image.trim());
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error("scheme");
            }
        } catch {
            errors.image = "Enter an http or https address.";
        }
    }
    if (form.variations.length === 0) {
        errors.variations = "Add at least one variation.";
    } else if (form.variations.length > MAX_VARIATIONS) {
        errors.variations = `Use at most ${MAX_VARIATIONS} variations.`;
    }

    const seenSkus = new Set<string>();
    form.variations.forEach((v, index) => {
        const at = `variations.${index}`;
        const vName = v.name.trim();
        if (!vName) errors[`${at}.name`] = "Enter a name.";
        else if (vName.length > MAX_NAME) {
            errors[`${at}.name`] = `Use at most ${MAX_NAME} characters.`;
        }
        const sku = v.sku.trim();
        if (sku.length > MAX_SKU) {
            errors[`${at}.sku`] = `Use at most ${MAX_SKU} characters.`;
        } else if (sku) {
            if (seenSkus.has(sku)) {
                errors[`${at}.sku`] = "Another variation uses this SKU.";
            }
            seenSkus.add(sku);
        }
        if (v.upc.trim() && !/^\d{8,14}$/.test(v.upc.trim())) {
            errors[`${at}.upc`] = "Use 8 to 14 digits.";
        }
        if (v.pricingType === "FIXED") {
            if (!v.price.trim()) errors[`${at}.price`] = "Enter a price.";
            else {
                const problem = priceProblem(v.price.trim());
                if (problem) errors[`${at}.price`] = problem;
            }
        }
        for (const [locationId, text] of Object.entries(v.overrides)) {
            if (!form.locationIds.includes(locationId) || !text.trim())
                continue;
            const problem = priceProblem(text.trim());
            if (problem) errors[`${at}.overrides.${locationId}`] = problem;
        }
    });
    return errors;
}

/**
 * Builds the request body. Call only for a form that passed validateForm.
 * @param form the form
 * @param isArchived whether the item is archived (kept as it is)
 * @returns the body for POST and PUT
 */
export function formToInput(form: ItemForm, isArchived: boolean): ItemInput {
    const money = (text: string) => ({
        amount: Number(convertDollarsToCents(text.trim())),
        currency: form.currency as never,
    });
    return {
        name: form.name.trim(),
        displayName: form.displayName.trim() || null,
        labelColor: form.labelColor.trim() || null,
        isTaxable: form.isTaxable,
        isArchived,
        image: form.image.trim() || null,
        categoryIds: form.categoryIds,
        locationIds: form.locationIds,
        variations: form.variations.map((v): ItemVariationInput => {
            const overrides = Object.entries(v.overrides)
                .filter(
                    ([locationId, text]) =>
                        form.locationIds.includes(locationId) && text.trim(),
                )
                .map(([locationId, text]) => ({
                    locationId,
                    priceMoney: money(text),
                }));
            return {
                id: v.id,
                name: v.name.trim(),
                sku: v.sku.trim() || null,
                upc: v.upc.trim() || null,
                pricingType: v.pricingType,
                priceMoney:
                    v.pricingType === "FIXED" && v.price.trim()
                        ? money(v.price)
                        : null,
                trackInventory: v.trackInventory,
                locationOverrides: overrides,
            };
        }),
    };
}

/**
 * Maps the backend's field paths onto the form's field names.
 * @param problems the backend's errors
 * @param form the form they were produced for
 * @returns field messages, plus any that match no field
 */
export function mapServerErrors(
    problems: CatalogFieldError[],
    form: ItemForm,
): { fields: FormErrors; general: string[] } {
    const fields: FormErrors = {};
    const general: string[] = [];
    for (const { path, message } of problems) {
        const variation = /^variations\[(\d+)\]\.(\w+)(?:\[(\d+)\])?/.exec(
            path,
        );
        let key: string | undefined;
        if (variation) {
            const [, index, field, sub] = variation;
            if (field === "priceMoney") key = `variations.${index}.price`;
            else if (field === "locationOverrides") {
                const v = form.variations[Number(index)];
                const locationId = v
                    ? Object.keys(v.overrides).filter((id) =>
                          v.overrides[id].trim(),
                      )[Number(sub)]
                    : undefined;
                key = locationId
                    ? `variations.${index}.overrides.${locationId}`
                    : undefined;
            } else key = `variations.${index}.${field}`;
        } else if (/^(categoryIds|locationIds)\[/.test(path)) {
            key = path.split("[")[0];
        } else if (/^\w+$/.test(path)) {
            key = path;
        }
        const label = (key ?? path)
            .split(/[.[\]]+/)
            .filter(Boolean)
            .pop();
        const sentence = `The ${label} ${message}.`;
        if (key && !fields[key]) fields[key] = sentence;
        else general.push(sentence);
    }
    return { fields, general };
}
