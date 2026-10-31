import { useEffect } from "react";
import { navItemClass } from "@/components/navItemClass.ts";
import {
    type CatalogSubView,
    useCatalogStore,
} from "@/stores/catalog/useCatalogStore.ts";
import ItemsView from "./ItemsView.tsx";
import CategoriesView from "./CategoriesView.tsx";
import ImportExportView from "./ImportExportView.tsx";

const TABS: { view: CatalogSubView; label: string }[] = [
    { view: "items", label: "Items" },
    { view: "categories", label: "Categories" },
    { view: "import", label: "Import / Export" },
];

export default function Catalog() {
    const subView = useCatalogStore((s) => s.subView);
    const setSubView = useCatalogStore((s) => s.setSubView);
    const canManage = useCatalogStore((s) => s.canManage);
    const loadReference = useCatalogStore((s) => s.loadReference);
    const loadItems = useCatalogStore((s) => s.loadItems);

    useEffect(() => {
        void loadReference();
        void loadItems();
    }, [loadReference, loadItems]);

    return (
        <div className="flex flex-col gap-5 p-5">
            <h1 className="text-3xl">Catalog</h1>
            {canManage === false && (
                <p
                    role="status"
                    className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                    The catalog is managed in Square. It is read-only here.
                    Changes made in Square appear after the next sync.
                </p>
            )}
            <div
                role="group"
                aria-label="Catalog sections"
                className="flex border-b">
                {TABS.map((tab) => (
                    <button
                        key={tab.view}
                        aria-pressed={subView === tab.view}
                        className={navItemClass(subView === tab.view)}
                        onClick={() => setSubView(tab.view)}>
                        {tab.label}
                    </button>
                ))}
            </div>
            {subView === "items" && <ItemsView />}
            {subView === "categories" && <CategoriesView />}
            {subView === "import" && <ImportExportView />}
        </div>
    );
}
