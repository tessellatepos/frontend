import { Button } from "@/components/ui/button.tsx";
import {
    downloadSample,
    useCatalogImportStore,
} from "@/stores/catalog/useCatalogImportStore.ts";
import { useCatalogStore } from "@/stores/catalog/useCatalogStore.ts";
import type { CatalogImportReport } from "@tessellatepos/sdk";

function Summary({ report }: { report: CatalogImportReport }) {
    const s = report.summary;
    return (
        <ul className="text-sm">
            <li>Rows read: {s.rows}</li>
            <li>Items to create: {s.itemsCreated}</li>
            <li>Items to update: {s.itemsUpdated}</li>
            <li>Variations to create: {s.variationsCreated}</li>
            <li>Variations to update: {s.variationsUpdated}</li>
            <li>Categories to create: {s.categoriesCreated}</li>
            <li>Rows with errors: {s.errors}</li>
        </ul>
    );
}

function RowErrors({ report }: { report: CatalogImportReport }) {
    const bad = report.rows.filter((r) => r.errors.length > 0);
    if (bad.length === 0) return null;
    return (
        <table className="w-full text-left text-sm">
            <caption className="text-left font-medium">Problems</caption>
            <thead>
                <tr className="border-b">
                    <th className="p-2">Line</th>
                    <th className="p-2">Column</th>
                    <th className="p-2">Problem</th>
                </tr>
            </thead>
            <tbody>
                {bad.flatMap((r) =>
                    r.errors.map((e, i) => (
                        <tr
                            key={`${r.line}-${i}`}
                            className="border-b">
                            <td className="p-2">{r.line}</td>
                            <td className="p-2">{e.path}</td>
                            <td className="p-2">{e.message}</td>
                        </tr>
                    )),
                )}
            </tbody>
        </table>
    );
}

export default function ImportExportView() {
    const canManage = useCatalogStore((s) => s.canManage);
    const s = useCatalogImportStore();

    return (
        <div className="flex flex-col gap-6">
            <section
                aria-labelledby="export-heading"
                className="flex flex-col gap-2">
                <h3
                    id="export-heading"
                    className="text-lg">
                    Export
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => void s.download("false")}>
                        Export active items
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => void s.download("all")}>
                        Export all items
                    </Button>
                </div>
            </section>
            {s.error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {s.error}
                </p>
            )}
            {canManage && (
                <section
                    aria-labelledby="import-heading"
                    className="flex flex-col gap-3">
                    <h3
                        id="import-heading"
                        className="text-lg">
                        Import
                    </h3>
                    <p className="text-sm text-gray-600">
                        Rows match existing items by SKU, or by item name when
                        there is no SKU. The file is checked first and nothing
                        changes until you confirm.
                    </p>
                    <div className="flex items-end gap-3">
                        <label className="flex flex-col gap-1 text-sm">
                            CSV file
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) =>
                                    void s.chooseFile(e.target.files?.[0])
                                }
                            />
                        </label>
                        <Button
                            variant="outline"
                            onClick={downloadSample}>
                            Download sample CSV
                        </Button>
                    </div>
                    {s.running && <p role="status">Working...</p>}
                    {s.report && (
                        <div className="flex flex-col gap-3">
                            <h4 className="font-medium">
                                Check of {s.fileName}
                            </h4>
                            <Summary report={s.report} />
                            <RowErrors report={s.report} />
                            <div className="flex gap-2">
                                <Button
                                    disabled={
                                        s.running || s.report.summary.errors > 0
                                    }
                                    onClick={() => void s.confirm()}>
                                    Import
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={s.reset}>
                                    Cancel
                                </Button>
                            </div>
                            {s.report.summary.errors > 0 && (
                                <p className="text-sm">
                                    Fix the problems and choose the file again.
                                </p>
                            )}
                        </div>
                    )}
                    {s.imported && (
                        <div
                            role="status"
                            className="flex flex-col gap-2">
                            <h4 className="font-medium">Import finished</h4>
                            <Summary report={s.imported} />
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
