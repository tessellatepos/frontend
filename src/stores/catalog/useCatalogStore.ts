import { create } from "zustand";
import type { Item, ItemQuery, Location } from "@tessellatepos/sdk";
import {
    type CategoryNode,
    CatalogApiError,
    createCategory,
    deleteCategory,
    listCategories,
    listItems,
    listStorefronts,
    updateCategory,
} from "./api.ts";

export type CatalogSubView = "items" | "categories" | "import";

export type CatalogFilters = Required<
    Pick<ItemQuery, "q" | "categoryId" | "locationId" | "archived">
>;

export const PAGE_SIZE = 25;

interface CatalogState {
    subView: CatalogSubView;
    setSubView: (view: CatalogSubView) => void;
    /** Null until the first response says whether the provider allows edits. */
    canManage: boolean | null;
    storefronts: Location[];
    categories: CategoryNode[];
    items: Item[];
    total: number;
    offset: number;
    filters: CatalogFilters;
    loading: boolean;
    error: string;
    /** Loads the storefronts and categories the filters and editor offer. */
    loadReference: () => Promise<void>;
    loadItems: () => Promise<void>;
    setFilters: (patch: Partial<CatalogFilters>) => void;
    setOffset: (offset: number) => void;
    saveCategory: (
        id: string | null,
        fields: { name: string; parentCategoryId: string | null },
    ) => Promise<string>;
    removeCategory: (id: string) => Promise<string>;
}

function message(err: unknown): string {
    return err instanceof CatalogApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

// Only the newest items request may update the screen.
let itemsRequest = 0;

export const useCatalogStore = create<CatalogState>((set, get) => ({
    subView: "items",
    setSubView: (subView) => set({ subView }),
    canManage: null,
    storefronts: [],
    categories: [],
    items: [],
    total: 0,
    offset: 0,
    filters: { q: "", categoryId: "", locationId: "", archived: "false" },
    loading: false,
    error: "",

    loadReference: async () => {
        try {
            const [storefronts, categories] = await Promise.all([
                listStorefronts(),
                listCategories(),
            ]);
            set({
                storefronts,
                categories: categories.categories,
                canManage: categories.canManage,
            });
        } catch (err) {
            set({ error: message(err) });
        }
    },

    loadItems: async () => {
        const request = ++itemsRequest;
        const { filters, offset } = get();
        set({ loading: true, error: "" });
        try {
            const page = await listItems({
                ...filters,
                limit: PAGE_SIZE,
                offset,
            });
            if (request !== itemsRequest) return;
            set({
                items: page.items,
                total: page.total,
                canManage: page.canManage,
            });
        } catch (err) {
            if (request === itemsRequest) set({ error: message(err) });
        } finally {
            if (request === itemsRequest) set({ loading: false });
        }
    },

    setFilters: (patch) => {
        set((s) => ({ filters: { ...s.filters, ...patch }, offset: 0 }));
        void get().loadItems();
    },

    setOffset: (offset) => {
        set({ offset });
        void get().loadItems();
    },

    saveCategory: async (id, fields) => {
        try {
            if (id) await updateCategory(id, fields);
            else await createCategory(fields);
            await get().loadReference();
            return "";
        } catch (err) {
            return message(err);
        }
    },

    removeCategory: async (id) => {
        try {
            await deleteCategory(id);
            await get().loadReference();
            // Items may have been unlinked from it, and a filter may point at it.
            if (get().filters.categoryId === id) {
                get().setFilters({ categoryId: "" });
            } else {
                void get().loadItems();
            }
            return "";
        } catch (err) {
            return message(err);
        }
    },
}));
