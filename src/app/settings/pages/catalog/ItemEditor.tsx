import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { FormField } from "@/components/FormField.tsx";
import { useCatalogStore } from "@/stores/catalog/useCatalogStore.ts";
import { useItemEditorStore } from "@/stores/catalog/useItemEditorStore.ts";

const selectClass =
    "h-9 rounded-md border border-input bg-transparent px-2 font-normal";

const CONFIRM_TEXT = {
    archive: "Archive this item? It leaves the till but can be restored.",
    restore: "Restore this item to the till?",
    delete: "Delete this item permanently? This cannot be undone. Items on past orders cannot be deleted; archive them instead.",
} as const;

export default function ItemEditor() {
    const e = useItemEditorStore();
    const storefronts = useCatalogStore((s) => s.storefronts);
    const categories = useCatalogStore((s) => s.categories);
    const { form, errors } = e;
    const selected = storefronts.filter((l) => form.locationIds.includes(l.id));

    if (e.confirm) {
        return (
            <Dialog
                open={e.open}
                onOpenChange={(open) => !open && e.close()}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>
                            {e.confirm === "delete"
                                ? "Delete item"
                                : e.confirm === "archive"
                                  ? "Archive item"
                                  : "Restore item"}
                        </DialogTitle>
                        <DialogDescription>
                            {CONFIRM_TEXT[e.confirm]}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => e.setConfirm(null)}>
                            Back
                        </Button>
                        <Button
                            variant={
                                e.confirm === "delete"
                                    ? "destructive"
                                    : "default"
                            }
                            disabled={e.saving}
                            onClick={() => void e.runConfirmed()}>
                            {e.confirm === "delete"
                                ? "Delete"
                                : e.confirm === "archive"
                                  ? "Archive"
                                  : "Restore"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={e.open}
            onOpenChange={(open) => !open && e.close()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {e.itemId ? "Edit item" : "New item"}
                    </DialogTitle>
                    <DialogDescription>
                        Prices are in {form.currency}.
                    </DialogDescription>
                </DialogHeader>
                <form
                    noValidate
                    onSubmit={(ev) => {
                        ev.preventDefault();
                        void e.save();
                    }}
                    className="flex flex-col gap-4">
                    {e.formErrors.length > 0 && (
                        <div
                            role="alert"
                            className="rounded border border-red-300 p-3 text-sm text-red-700">
                            {e.formErrors.map((m) => (
                                <p key={m}>{m}</p>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="Name"
                            value={form.name}
                            error={errors.name}
                            onChange={(ev) =>
                                e.update({ name: ev.target.value })
                            }
                        />
                        <FormField
                            label="Display name"
                            value={form.displayName}
                            error={errors.displayName}
                            onChange={(ev) =>
                                e.update({ displayName: ev.target.value })
                            }
                        />
                        <FormField
                            label="Label colour"
                            placeholder="#1a2b3c"
                            value={form.labelColor}
                            error={errors.labelColor}
                            onChange={(ev) =>
                                e.update({ labelColor: ev.target.value })
                            }
                        />
                        <FormField
                            label="Image URL"
                            value={form.image}
                            error={errors.image}
                            onChange={(ev) =>
                                e.update({ image: ev.target.value })
                            }
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.isTaxable}
                            onChange={(ev) =>
                                e.update({ isTaxable: ev.target.checked })
                            }
                        />
                        Taxable
                    </label>

                    <fieldset className="flex flex-col gap-1">
                        <legend className="text-sm font-medium">
                            Categories
                        </legend>
                        {categories.length === 0 && (
                            <p className="text-sm text-gray-500">
                                No categories yet.
                            </p>
                        )}
                        {categories.map((c) => (
                            <label
                                key={c.id}
                                className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.categoryIds.includes(c.id)}
                                    onChange={() => e.toggleCategory(c.id)}
                                />
                                {c.name}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset className="flex flex-col gap-1">
                        <legend className="text-sm font-medium">Sold at</legend>
                        {storefronts.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Create a storefront first.
                            </p>
                        )}
                        {storefronts.map((l) => (
                            <label
                                key={l.id}
                                className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.locationIds.includes(l.id)}
                                    onChange={() => e.toggleLocation(l.id)}
                                />
                                {l.name ?? l.id}
                            </label>
                        ))}
                    </fieldset>

                    <section
                        aria-labelledby="variations-heading"
                        className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3
                                id="variations-heading"
                                className="text-sm font-medium">
                                Variations
                            </h3>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={e.addVariation}>
                                Add variation
                            </Button>
                        </div>
                        {errors.variations && (
                            <p
                                role="alert"
                                className="text-sm text-red-600">
                                {errors.variations}
                            </p>
                        )}
                        {form.variations.map((v, i) => {
                            const at = `variations.${i}`;
                            return (
                                <div
                                    key={v.key}
                                    role="group"
                                    aria-label={`Variation ${i + 1}`}
                                    className="flex flex-col gap-2 rounded border p-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <FormField
                                            label="Variation name"
                                            value={v.name}
                                            error={errors[`${at}.name`]}
                                            onChange={(ev) =>
                                                e.updateVariation(v.key, {
                                                    name: ev.target.value,
                                                })
                                            }
                                        />
                                        <FormField
                                            label="SKU"
                                            value={v.sku}
                                            error={errors[`${at}.sku`]}
                                            onChange={(ev) =>
                                                e.updateVariation(v.key, {
                                                    sku: ev.target.value,
                                                })
                                            }
                                        />
                                        <FormField
                                            label="UPC"
                                            value={v.upc}
                                            error={errors[`${at}.upc`]}
                                            onChange={(ev) =>
                                                e.updateVariation(v.key, {
                                                    upc: ev.target.value,
                                                })
                                            }
                                        />
                                        <label className="flex flex-col gap-1 text-sm font-medium">
                                            Pricing type
                                            <select
                                                className={selectClass}
                                                value={v.pricingType}
                                                onChange={(ev) =>
                                                    e.updateVariation(v.key, {
                                                        pricingType: ev.target
                                                            .value as
                                                            | "FIXED"
                                                            | "VARIABLE",
                                                    })
                                                }>
                                                <option value="FIXED">
                                                    Fixed
                                                </option>
                                                <option value="VARIABLE">
                                                    Variable
                                                </option>
                                            </select>
                                        </label>
                                        {v.pricingType === "FIXED" && (
                                            <FormField
                                                label="Price"
                                                inputMode="decimal"
                                                value={v.price}
                                                error={errors[`${at}.price`]}
                                                onChange={(ev) =>
                                                    e.updateVariation(v.key, {
                                                        price: ev.target.value,
                                                    })
                                                }
                                            />
                                        )}
                                        <label className="flex items-center gap-2 self-end pb-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={v.trackInventory}
                                                onChange={(ev) =>
                                                    e.updateVariation(v.key, {
                                                        trackInventory:
                                                            ev.target.checked,
                                                    })
                                                }
                                            />
                                            Track inventory
                                        </label>
                                    </div>
                                    {selected.length > 0 &&
                                        v.pricingType === "FIXED" && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {selected.map((l) => (
                                                    <FormField
                                                        key={l.id}
                                                        label={`Price at ${l.name ?? l.id}`}
                                                        inputMode="decimal"
                                                        placeholder="Same as price"
                                                        value={
                                                            v.overrides[l.id] ??
                                                            ""
                                                        }
                                                        error={
                                                            errors[
                                                                `${at}.overrides.${l.id}`
                                                            ]
                                                        }
                                                        onChange={(ev) =>
                                                            e.setOverride(
                                                                v.key,
                                                                l.id,
                                                                ev.target.value,
                                                            )
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={i === 0}
                                            aria-label={`Move variation ${i + 1} up`}
                                            onClick={() =>
                                                e.moveVariation(v.key, -1)
                                            }>
                                            Move up
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                i === form.variations.length - 1
                                            }
                                            aria-label={`Move variation ${i + 1} down`}
                                            onClick={() =>
                                                e.moveVariation(v.key, 1)
                                            }>
                                            Move down
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            aria-label={`Remove variation ${i + 1}`}
                                            onClick={() =>
                                                e.removeVariation(v.key)
                                            }>
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <DialogFooter className="sm:justify-between">
                        <div className="flex gap-2">
                            {e.itemId && !e.archived && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => e.setConfirm("archive")}>
                                    Archive
                                </Button>
                            )}
                            {e.itemId && e.archived && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => e.setConfirm("restore")}>
                                    Restore
                                </Button>
                            )}
                            {e.itemId && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => e.setConfirm("delete")}>
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={e.close}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={e.saving}>
                                {e.saving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
