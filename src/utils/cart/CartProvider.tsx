import { type ReactNode, useReducer } from "react";
import { CartContext } from "@/utils/cart/CartContext.ts";
import type { cartItem } from "@tessellatepos/common/src/types/universalTypes.ts";
import { cartReducer } from "@/utils/cart/CartState.ts";
import { Cart as CartBase } from "@tessellatepos/common/src/core/cart.ts";
import { Logger } from "tslog";

const logger = new Logger();

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, { cart: new CartBase() });

    const getItems = () => state.cart.getItems();

    const getTotal = () => state.cart.getTotal();

    const clearCart = () => dispatch({ type: "CLEAR_CART" });

    const addQuantity = (item: cartItem) => {
        logger.debug("addQuantity in CartContext");
        dispatch({ type: "ADD_QUANTITY", payload: item });
    };

    const removeQuantity = (item: cartItem) =>
        dispatch({ type: "REMOVE_QUANTITY", payload: item });

    const removeItem = (item: cartItem) =>
        dispatch({ type: "REMOVE_ITEM", payload: item });

    return (
        <CartContext.Provider
            value={{
                state,
                dispatch,
                getItems,
                getTotal,
                clearCart,
                addQuantity,
                removeQuantity,
                removeItem,
            }}>
            {children}
        </CartContext.Provider>
    );
};
