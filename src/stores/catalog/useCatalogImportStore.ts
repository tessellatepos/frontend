import { create } from "zustand";
import { CATALOG_CSV_COLUMNS } from "@tessellatepos/sdk";
import type { CatalogImportReport } from "@tessellatepos/sdk";
import { CatalogApiError, MAX_CSV_BYTES, exportCsv, importCsv } from "./api.ts";
import { useCatalogStore } from "./useCatalogStore.ts";

interface ImportState {
    fileName: string;
    csv: string;
    /** The dry-run result for the chosen file, once checked. */
    report: CatalogImportReport | null;
    /** The result of the real import, once done. */
    imported: CatalogImportReport | null;
    running: boolean;
    error: string;
    chooseFile: (file: File | undefined) => Promise<void>;
    check: () => Promise<void>;
    confirm: () => Promise<void>;
    reset: () => void;
    download: (archived: "true" | "false" | "all") => Promise<void>;
}

function message(err: unknown): string {
    return err instanceof CatalogApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

/** Saves a Blob through a temporary link. */
function saveBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** A small example in the import format. */
export const SAMPLE_CSV = [
    CATALOG_CSV_COLUMNS.join(","),
    "Latte,Small,LATTE-S,,4.50,CAD,Drinks > Hot,,true,false",
    "Latte,Large,LATTE-L,,5.50,CAD,Drinks > Hot,,true,false",
    "Blueberry muffin,,MUFFIN-1,,3.25,CAD,Food,,true,false",
].join("\r\n");

const blank = {
    fileName: "",
    csv: "",
    report: null,
    imported: null,
    error: "",
};

export const useCatalogImportStore = create<ImportState>((set, get) => ({
    ...blank,
    running: false,

    chooseFile: async (file) => {
        set({ ...blank });
        if (!file) return;
        if (file.size > MAX_CSV_BYTES) {
            set({ error: "That file is larger than 1 MB." });
            return;
        }
        set({ fileName: file.name, csv: await file.text() });
        await get().check();
    },

    check: async () => {
        const { csv } = get();
        if (!csv) return;
        set({ running: true, error: "", report: null, imported: null });
        try {
            set({ report: await importCsv(csv, true) });
        } catch (err) {
            set({ error: message(err) });
        } finally {
            set({ running: false });
        }
    },

    confirm: async () => {
        const { csv, report } = get();
        if (!csv || !report || report.summary.errors > 0) return;
        set({ running: true, error: "" });
        try {
            const result = await importCsv(csv, false);
            if (result.applied) {
                set({ imported: result, report: null, csv: "", fileName: "" });
                const catalog = useCatalogStore.getState();
                await Promise.all([
                    catalog.loadItems(),
                    catalog.loadReference(),
                ]);
            } else {
                // Something changed since the check: show what is wrong now.
                set({
                    report: result,
                    error: "Nothing was imported. Fix the rows below and try again.",
                });
            }
        } catch (err) {
            set({ error: message(err) });
        } finally {
            set({ running: false });
        }
    },

    reset: () => set({ ...blank }),

    download: async (archived) => {
        set({ error: "" });
        try {
            saveBlob(await exportCsv(archived), "catalog.csv");
        } catch (err) {
            set({ error: message(err) });
        }
    },
}));

/** Saves the sample CSV. */
export function downloadSample() {
    saveBlob(
        new Blob([SAMPLE_CSV], { type: "text/csv" }),
        "catalog-sample.csv",
    );
}
