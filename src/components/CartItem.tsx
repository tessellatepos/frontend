import { CircleX } from "lucide-react";
import {
    Item,
    ItemContent,
    ItemActions,
    ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { MinusIcon, PlusIcon } from "lucide-react";
import { convertCentsToDollars } from "@tessellatepos/sdk";
import type { CartItem as CartItemType } from "@tessellatepos/sdk";
import { useCartStore } from "@/stores/cart/useCartStore.ts";

type Props = {
    item: CartItemType;
    /** false on checkout: the order is already created, so show it read-only. */
    editable?: boolean;
};

export default function CartItem({ item, editable = true }: Props) {
    const { removeQuantity, removeItem, addQuantity } = useCartStore();

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
                                    {item.priceMoney?.amount ? (
                                        <>
                                            $
                                            {convertCentsToDollars(
                                                item.priceMoney.amount,
                                            )}{" "}
                                            -{"\u00A0"}
                                        </>
                                    ) : (
                                        "Price varies"
                                    )}
                                </ItemTitle>
                                <ItemTitle className="text-xl">
                                    {item.parent?.name}
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
        </div>
    );
}
