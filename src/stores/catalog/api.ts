import { apiFetch } from "@/utils/apiFetch.ts";
import type {
    CatalogFieldError,
    CatalogImportReport,
    Item,
    ItemInput,
    ItemPage,
    ItemQuery,
    Location,
} from "@tessellatepos/sdk";

export interface CategoryNode {
    id: string;
    name: string;
    parentCategoryId: string | null;
    imageURL: string | null;
    itemCount: number;
}

export interface CategoryList {
    categories: CategoryNode[];
    canManage: boolean;
}

/** Biggest CSV the backend accepts; checked here so the file is not sent. */
export const MAX_CSV_BYTES = 1024 * 1024;

/** A failed catalog call: status, backend code and per-field problems. */
export class CatalogApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly fieldErrors: CatalogFieldError[];

    constructor(
        message: string,
        status: number,
        code?: string,
        fieldErrors: CatalogFieldError[] = [],
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.fieldErrors = fieldErrors;
    }
}

const FALLBACK: Record<number, string> = {
    401: "Your session has ended. Sign in again.",
    403: "You do not have permission to do that.",
    404: "That no longer exists.",
    409: "That conflicts with the current catalog.",
    413: "That file is too large.",
};

/**
 * Turns a non-OK response into a CatalogApiError. The backend never puts
 * request values in its messages, so they are safe to show.
 * @param response the failed response
 * @returns the error to throw
 */
async function failure(response: Response): Promise<CatalogApiError> {
    const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
        errors?: CatalogFieldError[];
    };
    return new CatalogApiError(
        body.message ??
            FALLBACK[response.status] ??
            "The request failed. Try again.",
        response.status,
        body.code,
        body.errors ?? [],
    );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(path, init);
    if (!response.ok) throw await failure(response);
    return (response.status === 204 ? undefined : await response.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export function listItems(query: ItemQuery): Promise<ItemPage> {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.categoryId) params.set("category", query.categoryId);
    if (query.locationId) params.set("location", query.locationId);
    params.set("archived", query.archived ?? "false");
    params.set("limit", String(query.limit ?? 25));
    params.set("offset", String(query.offset ?? 0));
    return request(`/api/v1/catalog/items?${params.toString()}`);
}

export const createItem = (input: ItemInput) =>
    request<Item>("/api/v1/catalog/items", json("POST", input));

export const replaceItem = (id: string, input: ItemInput) =>
    request<Item>(
        `/api/v1/catalog/items/${encodeURIComponent(id)}`,
        json("PUT", input),
    );

export const patchItem = (id: string, patch: Partial<ItemInput>) =>
    request<Item>(
        `/api/v1/catalog/items/${encodeURIComponent(id)}`,
        json("PATCH", patch),
    );

export const archiveItem = (id: string) =>
    request<Item>(`/api/v1/catalog/items/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });

export const deleteItem = (id: string) =>
    request<void>(`/api/v1/catalog/items/${encodeURIComponent(id)}?hard=true`, {
        method: "DELETE",
    });

export const listCategories = () =>
    request<CategoryList>("/api/v1/catalog/categories");

export const createCategory = (input: {
    name: string;
    parentCategoryId: string | null;
}) => request<CategoryNode>("/api/v1/catalog/categories", json("POST", input));

export const updateCategory = (
    id: string,
    patch: { name?: string; parentCategoryId?: string | null },
) =>
    request<CategoryNode>(
        `/api/v1/catalog/categories/${encodeURIComponent(id)}`,
        json("PATCH", patch),
    );

export const deleteCategory = (id: string) =>
    request<void>(`/api/v1/catalog/categories/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });

export const listStorefronts = () => request<Location[]>("/api/v1/locations");

/**
 * Sends CSV text to the importer. A 422 still carries a report (the rows
 * that failed), so it is returned rather than thrown.
 * @param csv the file's text
 * @param dryRun true to validate without writing
 * @returns the per-row report
 */
export async function importCsv(
    csv: string,
    dryRun: boolean,
): Promise<CatalogImportReport> {
    const response = await apiFetch(`/api/v1/catalog/import?dryRun=${dryRun}`, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csv,
    });
    if (response.ok || response.status === 422) {
        return (await response.json()) as CatalogImportReport;
    }
    throw await failure(response);
}

/**
 * Downloads the catalog as CSV in the import format.
 * @param archived which items to include
 * @returns the CSV file
 */
export async function exportCsv(archived: "true" | "false" | "all") {
    const response = await apiFetch(
        `/api/v1/catalog/export?archived=${archived}`,
    );
    if (!response.ok) throw await failure(response);
    return response.blob();
}
