import { create } from "zustand";
import type { Item } from "@tessellatepos/sdk";
import {
    CatalogApiError,
    archiveItem,
    createItem,
    deleteItem,
    patchItem,
    replaceItem,
} from "./api.ts";
import {
    type FormErrors,
    type ItemForm,
    type VariationForm,
    emptyForm,
    formFromItem,
    formToInput,
    mapServerErrors,
    newVariation,
    validateForm,
} from "./itemForm.ts";
import { useCatalogStore } from "./useCatalogStore.ts";

export type EditorConfirm = "archive" | "restore" | "delete" | null;

interface EditorState {
    open: boolean;
    /** Null while creating. */
    itemId: string | null;
    archived: boolean;
    form: ItemForm;
    errors: FormErrors;
    /** Problems the backend reported that match no field. */
    formErrors: string[];
    saving: boolean;
    confirm: EditorConfirm;
    openNew: () => void;
    openItem: (item: Item) => void;
    close: () => void;
    update: (patch: Partial<ItemForm>) => void;
    updateVariation: (key: string, patch: Partial<VariationForm>) => void;
    setOverride: (key: string, locationId: string, price: string) => void;
    addVariation: () => void;
    removeVariation: (key: string) => void;
    moveVariation: (key: string, direction: -1 | 1) => void;
    toggleLocation: (locationId: string) => void;
    toggleCategory: (categoryId: string) => void;
    setConfirm: (confirm: EditorConfirm) => void;
    save: () => Promise<void>;
    /** Archives, restores or hard-deletes after the confirmation. */
    runConfirmed: () => Promise<void>;
}

function defaultCurrency(): string {
    return useCatalogStore.getState().storefronts[0]?.currency ?? "CAD";
}

function failure(err: unknown): string {
    return err instanceof CatalogApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

/** Refreshes what the catalog screens show after a change. */
async function refresh() {
    const catalog = useCatalogStore.getState();
    await Promise.all([catalog.loadItems(), catalog.loadReference()]);
}

export const useItemEditorStore = create<EditorState>((set, get) => ({
    open: false,
    itemId: null,
    archived: false,
    form: emptyForm("CAD"),
    errors: {},
    formErrors: [],
    saving: false,
    confirm: null,

    openNew: () =>
        set({
            open: true,
            itemId: null,
            archived: false,
            form: emptyForm(defaultCurrency()),
            errors: {},
            formErrors: [],
            confirm: null,
        }),

    openItem: (item) =>
        set({
            open: true,
            itemId: item.id,
            archived: item.isArchived ?? false,
            form: formFromItem(item, defaultCurrency()),
            errors: {},
            formErrors: [],
            confirm: null,
        }),

    close: () => set({ open: false, confirm: null }),

    update: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),

    updateVariation: (key, patch) =>
        set((s) => ({
            form: {
                ...s.form,
                variations: s.form.variations.map((v) =>
                    v.key === key ? { ...v, ...patch } : v,
                ),
            },
        })),

    setOverride: (key, locationId, price) =>
        set((s) => ({
            form: {
                ...s.form,
                variations: s.form.variations.map((v) =>
                    v.key === key
                        ? {
                              ...v,
                              overrides: {
                                  ...v.overrides,
                                  [locationId]: price,
                              },
                          }
                        : v,
                ),
            },
        })),

    addVariation: () =>
        set((s) => ({
            form: {
                ...s.form,
                variations: [...s.form.variations, newVariation()],
            },
        })),

    removeVariation: (key) =>
        set((s) => ({
            form: {
                ...s.form,
                variations: s.form.variations.filter((v) => v.key !== key),
            },
        })),

    moveVariation: (key, direction) =>
        set((s) => {
            const list = [...s.form.variations];
            const from = list.findIndex((v) => v.key === key);
            const to = from + direction;
            if (from < 0 || to < 0 || to >= list.length) return s;
            [list[from], list[to]] = [list[to], list[from]];
            return { form: { ...s.form, variations: list } };
        }),

    toggleLocation: (locationId) =>
        set((s) => ({
            form: {
                ...s.form,
                locationIds: s.form.locationIds.includes(locationId)
                    ? s.form.locationIds.filter((id) => id !== locationId)
                    : [...s.form.locationIds, locationId],
            },
        })),

    toggleCategory: (categoryId) =>
        set((s) => ({
            form: {
                ...s.form,
                categoryIds: s.form.categoryIds.includes(categoryId)
                    ? s.form.categoryIds.filter((id) => id !== categoryId)
                    : [...s.form.categoryIds, categoryId],
            },
        })),

    setConfirm: (confirm) => set({ confirm }),

    save: async () => {
        const { form, itemId, archived, saving } = get();
        if (saving) return;
        const errors = validateForm(form);
        set({ errors, formErrors: [] });
        if (Object.keys(errors).length > 0) return;
        set({ saving: true });
        try {
            const input = formToInput(form, archived);
            if (itemId) await replaceItem(itemId, input);
            else await createItem(input);
            set({ open: false });
            await refresh();
        } catch (err) {
            if (err instanceof CatalogApiError && err.fieldErrors.length > 0) {
                const mapped = mapServerErrors(err.fieldErrors, form);
                set({
                    errors: mapped.fields,
                    formErrors: [err.message, ...mapped.general],
                });
            } else {
                set({ formErrors: [failure(err)] });
            }
        } finally {
            set({ saving: false });
        }
    },

    runConfirmed: async () => {
        const { confirm, itemId } = get();
        if (!confirm || !itemId) return;
        set({ saving: true, formErrors: [] });
        try {
            if (confirm === "archive") await archiveItem(itemId);
            else if (confirm === "restore") {
                await patchItem(itemId, { isArchived: false });
            } else await deleteItem(itemId);
            set({ open: false, confirm: null });
            await refresh();
        } catch (err) {
            set({ confirm: null, formErrors: [failure(err)] });
        } finally {
            set({ saving: false });
        }
    },
}));
