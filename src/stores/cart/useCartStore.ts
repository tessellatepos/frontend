import { create } from "zustand";
import { Cart, type CartItem, type Money } from "@tessellatepos/sdk";

interface CartState {
    cart: Cart;
    addQuantity: (item: CartItem) => void;
    removeQuantity: (item: CartItem) => void;
    removeItem: (item: CartItem) => void;
    setItemPrice: (item: CartItem, priceMoney: Money) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    cart: new Cart(),
    addQuantity: (item) => {
        get().cart.addQuantity(item);
        set((state) => ({
            cart: Object.assign(Object.create(Cart.prototype), state.cart),
        }));
    },
    removeQuantity: (item) => {
        get().cart.removeQuantity(item);
        set((state) => ({
            cart: Object.assign(Object.create(Cart.prototype), state.cart),
        }));
    },
    removeItem: (item) => {
        get().cart.removeItem(item);
        set((state) => ({
            cart: Object.assign(Object.create(Cart.prototype), state.cart),
        }));
    },
    setItemPrice: (item, priceMoney) => {
        get().cart.setItemPrice(item, priceMoney);
        set((state) => ({
            cart: Object.assign(Object.create(Cart.prototype), state.cart),
        }));
    },
    clearCart: () => {
        get().cart.clearCart();
        set((state) => ({
            cart: Object.assign(Object.create(Cart.prototype), state.cart),
        }));
    },
}));
