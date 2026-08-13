import CartItem from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType } from "@tessellatepos/sdk";
import { convertCentsToDollars } from "@tessellatepos/sdk";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useCartStore } from "@/stores/cart/useCartStore.ts";

export default function Cart() {
    const { cart, clearCart } = useCartStore();
    const navigate = useNavigate();
    const total = cart.getTotal();

    useEffect(() => {
        console.log("Cart total changed:", convertCentsToDollars(total));
    }, [total]);

    const createOrder = () => {
        navigate("/storefront/cart");
    };

    return (
        <div className="bg-gray-200 w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto overscroll-auto no-scrollbar p-3">
                <div className="space-y-1">
                    {cart.getItems().map((item: CartItemType) => (
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
                    variant="default"
                    onClick={createOrder}>
                    Checkout
                </Button>
            </div>
        </div>
    );
}
