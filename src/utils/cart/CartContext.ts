import { createContext, type Dispatch, useContext } from "react";
import type { CartItem } from "@tessellatepos/sdk";
import { type CartAction, type CartState } from "@/utils/cart/CartState.ts";

type cartActionTypes = {
    state: CartState;
    dispatch: Dispatch<CartAction>;
    getItems: () => CartItem[];
    getTotal: () => bigint;
    clearCart: () => void;
    addQuantity: (item: CartItem) => void;
    removeQuantity: (item: CartItem) => void;
    removeItem: (item: CartItem) => void;
};

export const CartContext = createContext<cartActionTypes | undefined>(
    undefined,
);

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
