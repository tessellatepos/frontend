import { create } from "zustand";
import type { squareDiscount } from "@tessellatepos/common/src/types/squareTypes.ts";

interface OrdersState {
    discounts: squareDiscount[];
    setDiscounts: (discounts: squareDiscount[]) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
    discounts: [],
    setDiscounts: (discounts) => set({ discounts }),
}));
