import type { CartItem as CartItemType } from "@tessellatepos/sdk";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { convertCentsToDollars } from "@/utils/money.ts";
import { useOrdersStore } from "@/stores/order/useOrdersStore.ts";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    CASH: "Cash",
    TERMINAL: "Card — Terminal",
    MOBILE_READER: "Card — Mobile Reader",
};

export default function ReceiptPage() {
    const {
        completedOrder,
        paymentMethod,
        changeDueCents,
        clearCompletedOrder,
    } = useOrdersStore();
    const navigate = useNavigate();

    // No completed order in state (e.g. page refresh) — nothing to show.
    useEffect(() => {
        if (!completedOrder) void navigate("/storefront");
    }, [completedOrder, navigate]);

    if (!completedOrder) return null;

    function handleNewOrder() {
        clearCompletedOrder();
        void navigate("/storefront");
    }

    return (
        <div>
            <h1>Order Confirmed</h1>
            <p>Order #{completedOrder.id ?? completedOrder.referenceId}</p>

            <div>
                {completedOrder.lineItems?.map((item: CartItemType) => (
                    <p key={item.itemId ?? item.name}>
                        {item.quantity?.toString()}×{" "}
                        {item.parent?.name ?? item.name}
                    </p>
                ))}
            </div>

            <div>
                <p>
                    Subtotal: $
                    {convertCentsToDollars(
                        completedOrder.netAmount?.totalMoney?.amount ?? 0n,
                    )}
                </p>
                <p>
                    Tax: $
                    {convertCentsToDollars(
                        completedOrder.netAmount?.taxMoney?.amount ?? 0n,
                    )}
                </p>
                <p>
                    Total: $
                    {convertCentsToDollars(
                        completedOrder.totalMoney?.amount ?? 0n,
                    )}
                </p>
                <p>
                    Payment method:{" "}
                    {paymentMethod
                        ? (PAYMENT_METHOD_LABEL[paymentMethod] ?? paymentMethod)
                        : "Unknown"}
                </p>
                {paymentMethod === "CASH" && changeDueCents !== null && (
                    <p>
                        Change due: $
                        {convertCentsToDollars(changeDueCents ?? 0n)}
                    </p>
                )}
            </div>

            <Button onClick={handleNewOrder}>New Order</Button>
        </div>
    );
}
