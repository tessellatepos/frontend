import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
    PAGE_SIZE,
    useCatalogStore,
} from "@/stores/catalog/useCatalogStore.ts";
import { useItemEditorStore } from "@/stores/catalog/useItemEditorStore.ts";
import { convertCentsToDollars } from "@tessellatepos/sdk";
import type { Item } from "@tessellatepos/sdk";
import ItemEditor from "./ItemEditor.tsx";

function priceRange(item: Item): string {
    const amounts = (item.variations ?? []).flatMap((v) =>
        v.priceMoney ? [BigInt(v.priceMoney.amount)] : [],
    );
    if (amounts.length === 0) return "";
    const lo = amounts.reduce((a, b) => (b < a ? b : a));
    const hi = amounts.reduce((a, b) => (b > a ? b : a));
    return lo === hi
        ? convertCentsToDollars(lo)
        : `${convertCentsToDollars(lo)} to ${convertCentsToDollars(hi)}`;
}

const selectClass = "h-9 rounded-md border border-input bg-transparent px-2";

export default function ItemsView() {
    const s = useCatalogStore();
    const openNew = useItemEditorStore((e) => e.openNew);
    const openItem = useItemEditorStore((e) => e.openItem);
    const last = Math.min(s.offset + PAGE_SIZE, s.total);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1 text-sm">
                    <label htmlFor="catalog-search">Search</label>
                    <Input
                        id="catalog-search"
                        type="search"
                        value={s.filters.q}
                        onChange={(e) => s.setFilters({ q: e.target.value })}
                        placeholder="Name or SKU"
                    />
                </div>
                <label className="flex flex-col gap-1 text-sm">
                    Category
                    <select
                        className={selectClass}
                        value={s.filters.categoryId}
                        onChange={(e) =>
                            s.setFilters({ categoryId: e.target.value })
                        }>
                        <option value="">All categories</option>
                        {s.categories.map((c) => (
                            <option
                                key={c.id}
                                value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Storefront
                    <select
                        className={selectClass}
                        value={s.filters.locationId}
                        onChange={(e) =>
                            s.setFilters({ locationId: e.target.value })
                        }>
                        <option value="">All storefronts</option>
                        {s.storefronts.map((l) => (
                            <option
                                key={l.id}
                                value={l.id}>
                                {l.name ?? l.id}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Status
                    <select
                        className={selectClass}
                        value={s.filters.archived}
                        onChange={(e) =>
                            s.setFilters({
                                archived: e.target
                                    .value as typeof s.filters.archived,
                            })
                        }>
                        <option value="false">Active</option>
                        <option value="true">Archived</option>
                        <option value="all">All</option>
                    </select>
                </label>
                {s.canManage && (
                    <Button
                        className="ml-auto"
                        onClick={openNew}>
                        New item
                    </Button>
                )}
            </div>
            {s.error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {s.error}
                </p>
            )}
            <table className="w-full text-left text-sm">
                <caption className="sr-only">Catalog items</caption>
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Name</th>
                        <th className="p-2">Variations</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Categories</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {s.items.map((item) => (
                        <tr
                            key={item.id}
                            className="border-b">
                            <td className="p-2">
                                <button
                                    className="text-left underline-offset-2 hover:underline"
                                    onClick={() => openItem(item)}>
                                    {item.name}
                                </button>
                            </td>
                            <td className="p-2">
                                {item.variations?.length ?? 0}
                            </td>
                            <td className="p-2">{priceRange(item)}</td>
                            <td className="p-2">
                                {(item.categories ?? [])
                                    .map((c) => c.name)
                                    .join(", ")}
                            </td>
                            <td className="p-2">
                                {item.isArchived ? "Archived" : "Active"}
                            </td>
                        </tr>
                    ))}
                    {!s.loading && s.items.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="p-3 text-gray-500">
                                No items found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex items-center gap-3 text-sm">
                <span aria-live="polite">
                    {s.total === 0
                        ? "0 items"
                        : `${s.offset + 1} to ${last} of ${s.total}`}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={s.offset === 0}
                    onClick={() =>
                        s.setOffset(Math.max(0, s.offset - PAGE_SIZE))
                    }>
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={s.offset + PAGE_SIZE >= s.total}
                    onClick={() => s.setOffset(s.offset + PAGE_SIZE)}>
                    Next
                </Button>
            </div>
            <ItemEditor />
        </div>
    );
}
