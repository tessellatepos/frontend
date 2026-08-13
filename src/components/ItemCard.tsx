import {
    Item,
    ItemContent,
    ItemDescription,
    ItemHeader,
    ItemTitle,
} from "@/components/ui/item";
import type {
    CartItem as CartItemType,
    ItemVariation as ItemVariationType,
    Item as ItemType,
} from "@tessellatepos/sdk";
import { convertCentsToDollars } from "@tessellatepos/sdk";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import placeholderImage from "@/components/ui/no_image.webp";
import { useCartStore } from "@/stores/cart/useCartStore.ts";

type Props = {
    item?: CartItemType;
    parentItem?: ItemType;
    className?: string;
};

type ItemVariationProps = {
    item?: CartItemType;
    className?: string;
    parent?: ItemType;
    variationIndex?: number;
};

type ParentItemCardProps = {
    parentItem: ItemType;
    className?: string;
};

export default function ItemCard({ item, parentItem, className = "" }: Props) {
    const { addQuantity } = useCartStore();
    const convertParentToCartItems = (parent: ItemType): CartItemType[] => {
        return (
            parent?.variations?.map((variation: ItemVariationType) => {
                return {
                    ...variation,
                    itemId: variation.itemId,
                    imageURL: parent?.image ?? "",
                    parent: { id: parent.id, name: parent.name },
                } as CartItemType;
            }) || []
        );
    };

    function ParentItemCard({
        parentItem,
        className = "",
    }: ParentItemCardProps) {
        const variations = convertParentToCartItems(parentItem);

        return (
            <Dialog>
                <DialogTrigger>
                    <Item
                        variant="outline"
                        className="flex flex-col h-full">
                        <ItemHeader className={`w-full`}>
                            {parentItem?.image ? (
                                <div className={`w-full aspect-square`}>
                                    <img
                                        src={parentItem.image}
                                        alt={`${parentItem?.name} Selectable Card`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className={`w-full aspect-square`}>
                                    <img
                                        src={placeholderImage}
                                        alt={`${parentItem?.name} Selectable Card`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )}
                        </ItemHeader>
                        <ItemContent className="flex-1 flex flex-col justify-between h-16">
                            <ItemTitle
                                className="text-2xl line-clamp-2 items-start text-balance"
                                title={parentItem?.name ?? undefined}>
                                {parentItem?.name} - a
                            </ItemTitle>
                        </ItemContent>
                        <ItemDescription className="text-xl text-black text-center h-5"></ItemDescription>
                    </Item>
                </DialogTrigger>
                <DialogContent className={"h-auto p-10"}>
                    {/* show variations; each variation can fall back to parent attributes */}
                    <div
                        className={
                            "grid grid-cols-3 gap-6 auto-rows-max justify-items-center"
                        }>
                        {variations.map((variation, idx) => (
                            <div key={variation.itemId}>
                                <ItemVariation
                                    item={variation}
                                    className={className}
                                    parent={parentItem}
                                    variationIndex={idx}
                                />
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    function ItemVariation({
        item,
        className = "",
        parent,
        variationIndex,
    }: ItemVariationProps) {
        const imageSrc = item?.imageURL ?? parent?.image ?? "";
        let titleText = item?.name ?? parent?.name ?? "item";

        if (variationIndex == 0 && parent?.displayName) {
            titleText = parent.displayName;
        }

        if (item?.name == "") {
            titleText = item.parent?.name ?? "Item Missing Title";
        }

        void imageSrc;
        void placeholderImage;

        return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <div
                role="button"
                tabIndex={0}
                aria-label={`Add ${titleText} to cart`}
                onClick={() => addQuantity(item as CartItemType)}
                className={`cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}>
                <Item
                    variant="outline"
                    className="flex flex-col h-full">
                    <ItemHeader>
                        {imageSrc ? (
                            <div
                                style={{ width: "100%", aspectRatio: "1 / 1" }}>
                                <img
                                    src={imageSrc}
                                    alt={`${titleText} Item Card`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>
                        ) : (
                            <div className={`w-full aspect-square`}>
                                <img
                                    src={placeholderImage}
                                    alt={`${parentItem?.name} Selectable Card`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>
                        )}
                    </ItemHeader>
                    <ItemContent>
                        <ItemTitle className="text-2xl line-clamp-2 items-start h-16 text-balance">
                            {titleText}
                        </ItemTitle>
                        <ItemDescription className="text-xl text-black text-center">
                            {item?.pricingType === "FIXED" &&
                            item.priceMoney?.amount
                                ? `$${convertCentsToDollars(item.priceMoney.amount)}`
                                : "Price varies"}
                        </ItemDescription>
                    </ItemContent>
                </Item>
            </div>
        );
    }

    //use parentItem is available and has multiple variations
    if (parentItem && (parentItem.variations?.length ?? 0) > 1) {
        return (
            <ParentItemCard
                parentItem={parentItem}
                className={className}
            />
        );
    }

    const singleVariation =
        item ??
        (parentItem ? convertParentToCartItems(parentItem)[0] : undefined);

    return (
        <ItemVariation
            item={singleVariation}
            className={className}
            parent={parentItem}
            variationIndex={0}
        />
    );
}
