import type { CartItem as CartItemType } from "@tessellatepos/sdk";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { convertCentsToDollars } from "@tessellatepos/sdk";
import { useOrdersStore } from "@/stores/order/useOrdersStore.ts";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

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
    const { deviceId } = useSettingsStore();
    const navigate = useNavigate();
    const storefrontPath = deviceId ? `/storefront/${deviceId}` : "/storefront";

    // No completed order in state (e.g. page refresh) — nothing to show.
    useEffect(() => {
        if (!completedOrder) void navigate(storefrontPath);
    }, [completedOrder, navigate, storefrontPath]);

    if (!completedOrder) return null;

    function handleNewOrder() {
        clearCompletedOrder();
        void navigate(storefrontPath);
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-6 dark:bg-gray-900">
            <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <div className="flex flex-col items-center gap-2 text-center">
                    <CheckCircle2 className="size-10 text-green-500" />
                    <h1 className="text-2xl font-semibold">Order Confirmed</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Order #{completedOrder.id ?? completedOrder.referenceId}
                    </p>
                </div>

                <Separator />

                <div className="flex flex-col gap-1">
                    {completedOrder.lineItems?.map((item: CartItemType) => (
                        <div
                            key={item.itemId ?? item.name}
                            className="flex justify-between text-sm">
                            <span>
                                {item.quantity?.toString()}×{" "}
                                {item.parent?.name ?? item.name}
                            </span>
                            <span>
                                $
                                {convertCentsToDollars(
                                    item.priceMoney?.amount ?? 0n,
                                )}
                            </span>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                            $
                            {convertCentsToDollars(
                                completedOrder.netAmount?.totalMoney?.amount ??
                                    0n,
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax</span>
                        <span>
                            $
                            {convertCentsToDollars(
                                completedOrder.netAmount?.taxMoney?.amount ??
                                    0n,
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-gray-100">
                        <span>Total</span>
                        <span>
                            $
                            {convertCentsToDollars(
                                completedOrder.totalMoney?.amount ?? 0n,
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span>Payment method</span>
                        <span>
                            {paymentMethod
                                ? (PAYMENT_METHOD_LABEL[paymentMethod] ??
                                  paymentMethod)
                                : "Unknown"}
                        </span>
                    </div>
                    {paymentMethod === "CASH" && changeDueCents !== null && (
                        <div className="flex justify-between">
                            <span>Change due</span>
                            <span>
                                ${convertCentsToDollars(changeDueCents ?? 0n)}
                            </span>
                        </div>
                    )}
                </div>

                <Button
                    className="mt-2 p-6 text-lg"
                    onClick={handleNewOrder}>
                    New Order
                </Button>
            </div>
        </div>
    );
}
