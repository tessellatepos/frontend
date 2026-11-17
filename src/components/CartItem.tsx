import { CircleX } from "lucide-react";
import {
    Item,
    ItemContent,
    ItemActions,
    ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { MinusIcon, PlusIcon } from "lucide-react";
import {
    convertCentsToDollars,
    convertDollarsToCents,
} from "@tessellatepos/sdk";
import type { CartItem as CartItemType } from "@tessellatepos/sdk";
import { useState } from "react";
import { useCartStore } from "@/stores/cart/useCartStore.ts";

type Props = {
    item: CartItemType;
    /** false on checkout: the order is already created, so show it read-only. */
    editable?: boolean;
};

export default function CartItem({ item, editable = true }: Props) {
    const { removeQuantity, removeItem, addQuantity, setItemPrice } =
        useCartStore();
    const [priceOpen, setPriceOpen] = useState(false);
    const [priceInput, setPriceInput] = useState("");
    const [priceError, setPriceError] = useState(false);

    const titleText = item.name || item.parent?.name || "item";

    const openPriceEditor = () => {
        setPriceInput(
            item.priceMoney?.amount != null
                ? convertCentsToDollars(item.priceMoney.amount)
                : "",
        );
        setPriceError(false);
        setPriceOpen(true);
    };

    const confirmPrice = () => {
        const cents = convertDollarsToCents(priceInput);
        if (cents === null) {
            setPriceError(true);
            return;
        }
        setItemPrice(item, {
            amount: cents,
            // TODO: pull default currency from settings instead of hardcoding
            currency: item.priceMoney?.currency ?? "CAD",
        });
        setPriceOpen(false);
    };

    const priceLabel = item.priceMoney?.amount ? (
        <>
            ${convertCentsToDollars(item.priceMoney.amount)} -{" "}
        </>
    ) : (
        "Price varies"
    );

    return (
        <div className="flex w-full">
            <Item
                variant="default"
                className={`w-full`}>
                <ItemContent className="flex flex-col w-full">
                    <div
                        className={`flex flex-row justify-between items-center`}>
                        <div className={`flex flex-col gap-y-2`}>
                            <div
                                className={`flex flex-row justify-start items-start`}>
                                <ItemTitle className="text-xl">
                                    {editable ? (
                                        <button
                                            type="button"
                                            onClick={openPriceEditor}
                                            aria-label={`Edit price for ${titleText}`}
                                            className="underline decoration-dotted underline-offset-4 hover:opacity-70">
                                            {priceLabel}
                                        </button>
                                    ) : (
                                        priceLabel
                                    )}
                                </ItemTitle>
                                <ItemTitle className="text-xl">
                                    {item.parent?.name ?? item.name}
                                </ItemTitle>
                            </div>
                            <div>
                                <div>
                                    {item.quantity != null && !editable && (
                                        <div className="flex items-center gap-2">
                                            <span>Quantity:</span>
                                            <span>
                                                {item.quantity.toString()}
                                            </span>
                                        </div>
                                    )}
                                    {item.quantity != null && editable && (
                                        <div className="flex items-center gap-2">
                                            <span>Quantity:</span>
                                            <ButtonGroup>
                                                <Button
                                                    onClick={() =>
                                                        removeQuantity(item)
                                                    }>
                                                    <MinusIcon />
                                                </Button>
                                                <Button>
                                                    {item.quantity.toString()}
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        addQuantity(item)
                                                    }>
                                                    <PlusIcon />
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {editable && (
                            <ItemActions>
                                <button
                                    onClick={() => removeItem(item)}
                                    aria-label={`Remove ${item.name} from cart`}>
                                    <CircleX />
                                </button>
                            </ItemActions>
                        )}
                    </div>
                </ItemContent>
            </Item>
            {editable && (
                <Dialog
                    open={priceOpen}
                    onOpenChange={setPriceOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Edit price for {titleText}
                            </DialogTitle>
                        </DialogHeader>
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={priceInput}
                            onChange={(e) => {
                                setPriceInput(e.target.value);
                                setPriceError(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") confirmPrice();
                            }}
                        />
                        {priceError && (
                            <p className="text-sm text-destructive">
                                Enter a valid price, e.g. 4.99
                            </p>
                        )}
                        <DialogFooter>
                            <Button onClick={confirmPrice}>Save price</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
