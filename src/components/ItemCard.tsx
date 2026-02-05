import {
    Item,
    ItemContent,
    ItemDescription,
    ItemHeader,
    ItemTitle,
} from "@/components/ui/item"
import type {squareCartItem, squareItem} from "@tessellate/common/src/squareTypes";
import {convertCentsToDollars} from "@/app/util/money.ts";
import {Dialog, DialogContent, DialogTrigger} from "@/components/ui/dialog.tsx";
import placeholderImage from "@/components/ui/no_image.webp"

type Props = {
    item?: squareCartItem;
    parentItem?: squareItem;
    onAdd?: (item: squareCartItem) => void;
    className?: string;
};

type ItemVariationProps = {
    item?: squareCartItem;
    onAdd?: (item: squareCartItem) => void;
    className?: string;
    parent?: squareItem;
    variationIndex?: number;
};

type ParentItemCardProps = {
    parentItem: squareItem;
    onAdd?: (item: squareCartItem) => void;
    className?: string;
};

export default function ItemCard({ item, parentItem, onAdd, className = "" }: Props) {
    const convertParentToCartItems = (parent: squareItem): squareCartItem[] => {
        return parent?.variations?.map((variation, index) => {
            return {
                ...variation,
                itemId: variation.itemId,
                imageURL: parent?.imageURLs?.[index] ?? "",
                parent: { id: parent.id, name: parent.name },
            } as squareCartItem;
        }) || [];
    }

    function ParentItemCard({ parentItem, onAdd, className = "" }: ParentItemCardProps) {
        const variations = convertParentToCartItems(parentItem);

        return (
            <Dialog>
                <DialogTrigger>
                    <Item variant="outline" className="flex flex-col h-full">
                        <ItemHeader className={`w-full`}>
                            {parentItem?.imageURLs && parentItem?.imageURLs?.length > 0 ? (
                                <div className={`w-full aspect-square`}>
                                    <img
                                        src={parentItem.imageURLs[0]}
                                        alt={`${parentItem?.name} Selectable Card`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            ) : (
                                <div className={`w-full aspect-square`}>
                                    <img
                                        src={placeholderImage}
                                        alt={`${parentItem?.name} Selectable Card`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                        </ItemHeader>
                        <ItemContent className="flex-1 flex flex-col justify-between h-16">
                            <ItemTitle className="text-2xl line-clamp-2 items-start text-balance" title={parentItem?.name ?? undefined}>{parentItem?.name} - a</ItemTitle>
                        </ItemContent>
                        <ItemDescription className="text-xl text-black text-center h-5">
                        </ItemDescription>
                    </Item>
                </DialogTrigger>
                <DialogContent className={"h-auto p-10"}>
                    {/* show variations; each variation can fall back to parent attributes */}
                    <div className={"grid grid-cols-3 gap-6 auto-rows-max justify-items-center"}>
                        {variations.map((variation, idx) => (
                            <div key={variation.itemId}>
                                <ItemVariation
                                    item={variation}
                                    onAdd={onAdd}
                                    className={className}
                                    parent={parentItem}
                                    variationIndex={idx}
                                />
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    function ItemVariation({ item, onAdd, className = "", parent, variationIndex }: ItemVariationProps) {
        const handleActivate = () => {
            if (item) {
                onAdd?.(item);
            }
        };

        const imageSrc = item?.imageURL ?? parent?.imageURLs?.[variationIndex ?? 0] ?? "";
        let titleText = item?.name ?? parent?.name ?? "item";

        if (variationIndex == 0 && parent?.buyerFacingName) {
            titleText = parent.buyerFacingName;
        }

        if (item?.name == "") {
            titleText = item.parent?.name ?? "Item Missing Title";
        }

        return (
            <div
                role="button"
                tabIndex={0}
                aria-label={`Add ${titleText} to cart`}
                onClick={handleActivate}
                className={`cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
            >
                <Item variant="outline" className="flex flex-col h-full">
                    <ItemHeader>
                        {imageSrc ? (
                            <div style={{ width: '100%', aspectRatio: '1 / 1' }}>
                                <img
                                    src={imageSrc}
                                    alt={`${titleText} Item Card`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ) : (
                            <div className={`w-full aspect-square`}>
                                <img
                                    src={placeholderImage}
                                    alt={`${parentItem?.name} Selectable Card`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                    </ItemHeader>
                    <ItemContent>
                        <ItemTitle className="text-2xl line-clamp-2 items-start h-16 text-balance">{titleText}</ItemTitle>
                        <ItemDescription className="text-xl text-black text-center">
                            {(item?.pricingType === "FIXED_PRICING" && item.priceMoney?.amount) ? (
                                `$${convertCentsToDollars(item.priceMoney.amount)}`
                            ) : (
                                "Price varies"
                            )}
                        </ItemDescription>
                    </ItemContent>
                </Item>
            </div>
        )
    }

    //use parentItem is available and has multiple variations
    if (parentItem && (parentItem.variations?.length ?? 0) > 1) {
        return <ParentItemCard parentItem={parentItem} onAdd={onAdd} className={className} />;
    }

    const singleVariation = item ?? (parentItem ? convertParentToCartItems(parentItem)[0] : undefined);

    return <ItemVariation item={singleVariation} onAdd={onAdd} className={className} parent={parentItem} variationIndex={0} />;
}