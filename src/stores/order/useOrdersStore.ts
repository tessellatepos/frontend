import { create } from "zustand";
import type { Discount } from "@tessellatepos/sdk";

interface OrdersState {
    discounts: Discount[];
    setDiscounts: (discounts: Discount[]) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
    discounts: [],
    setDiscounts: (discounts) => set({ discounts }),
}));
