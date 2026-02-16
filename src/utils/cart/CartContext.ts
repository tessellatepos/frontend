import { createContext, type Dispatch, useContext } from "react";
import type { cartItem } from "@tessellate-pos/common/src/types/universalTypes.ts";
import { type CartAction, type CartState } from "@/utils/cart/CartState.ts";

type cartActionTypes = {
    state: CartState;
    dispatch: Dispatch<CartAction>;
    getItems: () => cartItem[];
    getTotal: () => bigint;
    clearCart: () => void;
    addQuantity: (item: cartItem) => void;
    removeQuantity: (item: cartItem) => void;
    removeItem: (item: cartItem) => void;
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
