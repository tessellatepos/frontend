import type {Dispatch, SetStateAction} from "react";
import { useMemo } from "react";
import CartItem from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import type {squareCartItem} from "@tessellate/common/src/squareTypes";
import {convertCentsToDollars} from "@/app/util/money";
import { Logger } from "@origranot/ts-logger";

const logger = new Logger();

type CartProps = {
	items: squareCartItem[];
	setItems: Dispatch<SetStateAction<squareCartItem[]>>;
};

export default function Cart({ items, setItems }: CartProps) {
    // const totalCents = useMemo(() => {
    //     logger.debug("RECALCULATING TOTAL", items.length);
    //     return items.reduce((sum: bigint, item: squareCartItem): bigint => {
    //         const amt = item.priceMoney?.amount;
    //         const qty = item.quantity;
    //
    //         if (typeof amt === "bigint" && typeof qty === "bigint") {
    //             return sum + amt * qty;
    //         }
    //         return sum;
    //     }, 0n);
    // }, [items]);
    const totalCents = items.reduce((sum: bigint, item: squareCartItem): bigint => {
        const amt = item.priceMoney?.amount;
        const qty = item.quantity;

        if (typeof amt === "bigint" && typeof qty === "bigint") {
            return sum + amt * qty;
        }
        return sum;
    }, 0n);


    const removeItem = (item: squareCartItem) => {
        setItems((prev) => prev.filter((ci) => ci.itemId !== item.itemId));
    };

    const addQuantity = (item: squareCartItem) => {
        console.log("addQuantity called for:", item.itemId, "current items:", items);
        setItems((prev) =>
            prev.map((ci) =>
                ci.itemId === item.itemId
                    ? { ...ci, quantity: (ci.quantity ?? 0n) + 1n }
                    : ci
            )
        );
    };

    const removeQuantity = (item: squareCartItem) => {
        setItems((prev) =>
            prev.flatMap((ci) => {
                if (ci.itemId !== item.itemId) return [ci];
                const q = ci.quantity ?? 0n;
                if (q > 1n) return [{ ...ci, quantity: q - 1n }];
                return [];
            })
        );
    };

	const clearCart = () => setItems([]);

	return (
        <div className="bg-gray-200 w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto overscroll-auto no-scrollbar p-3">
                <div className="space-y-1">
                    {items.map((item: squareCartItem) => (
                        <div key={item.itemId ?? item.name} className="w-full">
                            <CartItem
                                item={item}
                                onRemove={() => removeItem(item)}
                                onAdd={() => addQuantity(item)}
                                onSubtract={() => removeQuantity(item)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="sticky bottom-0 mt-4 flex gap-2 flex-col justify-center bg-gray-300 w-full p-4">
                <div className={"text-2xl font-medium leading-snug"}>Subtotal: ${convertCentsToDollars(totalCents)}</div>
                <Button className="bg-red-400 p-8 text-xl" size="lg" variant="default" onClick={clearCart}>Clear</Button>
                <Button className="bg-blue-600 p-8 text-xl" size="lg" variant="default">Checkout</Button>
            </div>
        </div>
	);
}
