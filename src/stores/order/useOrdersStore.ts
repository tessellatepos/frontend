import { create } from "zustand";
import type { Discount, Order } from "@tessellatepos/sdk";

export type PaymentMethod = "CASH" | "TERMINAL" | "MOBILE_READER";

interface OrdersState {
    discounts: Discount[];
    setDiscounts: (discounts: Discount[]) => void;
    // Set once payment is confirmed; read by the receipt page.
    completedOrder: Order | null;
    paymentMethod: PaymentMethod | null;
    changeDueCents: bigint | null;
    setCompletedOrder: (
        order: Order,
        paymentMethod: PaymentMethod,
        changeDueCents?: bigint | null,
    ) => void;
    clearCompletedOrder: () => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
    discounts: [],
    setDiscounts: (discounts) => set({ discounts }),
    completedOrder: null,
    paymentMethod: null,
    changeDueCents: null,
    setCompletedOrder: (order, paymentMethod, changeDueCents = null) =>
        set({ completedOrder: order, paymentMethod, changeDueCents }),
    clearCompletedOrder: () =>
        set({
            completedOrder: null,
            paymentMethod: null,
            changeDueCents: null,
        }),
}));
