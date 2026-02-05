import { CircleX } from "lucide-react"
import {
    Item,
    ItemContent,
    ItemActions,
    ItemTitle
} from "@/components/ui/item"
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { MinusIcon, PlusIcon } from "lucide-react"
import { convertCentsToDollars } from "@/app/util/money";
import type { squareCartItem } from "@tessellate/common/src/squareTypes";

type Props = {
    item: squareCartItem;
    onRemove?: (item: squareCartItem) => void;
    onAdd?: (item: squareCartItem) => void;
    onSubtract?: (item: squareCartItem) => void;
};

export default function CartItem({ item, onRemove, onAdd, onSubtract }: Props) {
    const handleActivate = () => {
        onRemove?.(item);
    };

    const handleAdd = () => {
        console.log("handleAdd clicked, item:", item);
        onAdd?.(item);
    }

    const handleRemove = () => {
        onSubtract?.(item);
    }

    return (
        <div className="flex w-full">
            <Item variant="default" className={`w-full`}>
                <ItemContent className="flex flex-col w-full">
                <div className={`flex flex-row justify-between items-center`}>
                    <div className={`flex flex-col gap-y-2`}>
                        <div className={`flex flex-row justify-start items-start`}>
                            <ItemTitle className="text-xl">
                                {(item?.pricingType === "FIXED_PRICING" && item.priceMoney?.amount) ? (
                                    <>${convertCentsToDollars(item.priceMoney.amount)} -{"\u00A0"}</>
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
                                {item.quantity && (
                                    <div className="flex items-center gap-2">
                                        <span>Quantity:</span>
                                        <ButtonGroup><Button onClick={handleRemove}>
                                            <MinusIcon />
                                        </Button>
                                            <Button>
                                                {item.quantity.toString()}
                                            </Button>
                                            <Button onClick={handleAdd}>
                                                <PlusIcon />
                                            </Button>
                                        </ButtonGroup>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <ItemActions>
                        <button onClick={handleActivate} aria-label={`Remove ${item.name} from cart`}>
                            <CircleX />
                        </button>
                    </ItemActions>
                </div>
                </ItemContent>
            </Item>
        </div>
    );
}