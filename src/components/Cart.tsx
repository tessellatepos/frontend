import CartItem from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import type { squareCartItem } from "@tessellate-pos/common/src/types/squareTypes";
import { convertCentsToDollars } from "@/utils/money.ts";
//import { Logger } from "@origranot/ts-logger";
import { useCart } from "@/utils/cart/CartContext.ts";
import { useEffect } from "react";

//const logger = new Logger({transports: [new ConsoleTransport()]});

export default function Cart() {
    const { getItems, getTotal, clearCart } = useCart();
    const total = getTotal();

    useEffect(() => {
        console.log("Cart total changed:", convertCentsToDollars(total));
    }, [total]);

    return (
        <div className="bg-gray-200 w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto overscroll-auto no-scrollbar p-3">
                <div className="space-y-1">
                    {getItems().map((item: squareCartItem) => (
                        <div
                            key={item.itemId ?? item.name}
                            className="w-full">
                            <CartItem item={item} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="sticky bottom-0 mt-4 flex gap-2 flex-col justify-center bg-gray-300 w-full p-4">
                <div className={"text-2xl font-medium leading-snug"}>
                    Subtotal: ${convertCentsToDollars(total)}
                </div>
                <Button
                    className="bg-red-400 p-8 text-xl"
                    size="lg"
                    variant="default"
                    onClick={clearCart}>
                    Clear
                </Button>
                <Button
                    className="bg-blue-600 p-8 text-xl"
                    size="lg"
                    variant="default">
                    Checkout
                </Button>
            </div>
        </div>
    );
}
