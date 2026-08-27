import type { Cart, CartItem } from "@tessellatepos/sdk";
import { Logger } from "tslog";

export interface CartState {
    cart: Cart;
}

const logger = new Logger();

export type CartAction =
    | { type: "ADD_QUANTITY"; payload: CartItem }
    | { type: "REMOVE_QUANTITY"; payload: CartItem }
    | { type: "REMOVE_ITEM"; payload: CartItem }
    | { type: "CLEAR_CART" };

export function cartReducer(state: CartState, action: CartAction): CartState {
    const newCart = Object.assign(
        Object.create(Object.getPrototypeOf(state.cart)),
        state.cart,
    );

    switch (action.type) {
        case "ADD_QUANTITY":
            logger.debug("add quantity");
            newCart.addQuantity(action.payload);
            return { cart: newCart };
        case "REMOVE_QUANTITY":
            logger.debug("remove quantity");
            newCart.removeQuantity(action.payload);
            return { cart: newCart };
        case "REMOVE_ITEM":
            logger.debug("remove item");
            newCart.removeItem(action.payload);
            return { cart: newCart };
        case "CLEAR_CART":
            logger.debug("clear cart");
            newCart.clearCart();
            return { cart: newCart };
        default:
            throw new Error(`Unhandled action type for cartReducer`);
    }
}
