import { apiFetch } from "@/utils/apiFetch.ts";
import CartItem from "@/components/CartItem";
import PaymentMethodPanel from "@/components/PaymentMethodPanel";
import type { CartItem as CartItemType, Order } from "@tessellatepos/sdk";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Logger } from "tslog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { convertCentsToDollars } from "@tessellatepos/sdk";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import {
    useOrdersStore,
    type PaymentMethod,
} from "@/stores/order/useOrdersStore.ts";
import { useCartStore } from "@/stores/cart/useCartStore.ts";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";

const logger = new Logger();

export default function CartPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [order, setOrder] = useState<Order>();
    const { locationId, deviceId } = useSettingsStore();
    const { discounts, setCompletedOrder } = useOrdersStore();
    const { cart, clearCart } = useCartStore();
    const navigate = useNavigate();

    const handlePaid = useCallback(
        (
            paidOrder: Order,
            method: PaymentMethod,
            changeDueCents?: bigint | null,
        ) => {
            setCompletedOrder(paidOrder, method, changeDueCents);
            clearCart();
            void navigate("/storefront/receipt");
        },
        [setCompletedOrder, clearCart, navigate],
    );

    const createOrder = useCallback(async () => {
        if (cart.getItems().length === 0) {
            setError(true);
            setErrorMessage("Cart is empty");
            return;
        }

        setLoading(true);
        const order: Order = {
            lineItems: cart.getItems(),
            locationId,
            discounts,
            //TODO remove development reference/indempotency key
            referenceId: crypto.randomUUID(),
            source: {
                name: `Tessellate POS - From Device:${deviceId}`,
            },
        };
        const response = await apiFetch(`/api/v1/orders/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order, (_, v) =>
                typeof v === "bigint" ? v.toString() : v,
            ),
        });

        if (response.status != 200) {
            const body: { message?: string } = await response.json();
            setError(true);
            setErrorMessage(body?.message ?? "Failed to create order");
            setLoading(false);
        } else {
            const orderRes: Order = await response.json();

            logger.debug("Fetched Order:", orderRes);

            if (orderRes) {
                setOrder(orderRes);
                setLoading(false);
            } else {
                setError(true);
                setErrorMessage("No order found in backend response");
                throw new Error("No order found in backend response");
            }
        }
    }, [cart, locationId, discounts, deviceId]);

    useEffect(() => {
        // Only create the order once, from the cart as it stood on mount —
        // `createOrder` gets a new identity when the cart is cleared after
        // payment (see handlePaid), and re-running this then would submit
        // an empty-cart order while we're navigating to the receipt.
        const doFetch = async () => {
            await createOrder();
        };
        void doFetch().catch((err) => {
            logger.error("Failed to create order", err);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900">
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 md:grid-cols-[3fr_2fr]">
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                deviceId
                                    ? void navigate(`/storefront/${deviceId}`)
                                    : void navigate(-1)
                            }>
                            <ArrowLeft />
                            Back to items
                        </Button>
                        <h1 className="text-2xl font-semibold">Checkout</h1>
                    </div>

                    {loading && !error && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-white p-8 text-gray-500 shadow-sm dark:bg-gray-800">
                            <Spinner />
                            <span>Creating order…</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                            <p>{errorMessage || "Failed to create order."}</p>
                            <Button
                                variant="destructive"
                                className="w-fit"
                                onClick={() => void createOrder()}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {order && !loading && !error && (
                        <div className="flex flex-col divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-gray-700 dark:bg-gray-800">
                            {order.lineItems?.map((item: CartItemType) => (
                                <div
                                    key={item.itemId ?? item.name}
                                    className="p-2">
                                    <CartItem
                                        item={item}
                                        editable={false}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <aside className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <h2 className="text-lg font-medium">Order Summary</h2>
                        <Separator />
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Subtotal</span>
                            <span>
                                $
                                {convertCentsToDollars(
                                    order?.netAmount?.totalMoney?.amount ?? 0n,
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Tax</span>
                            <span>
                                $
                                {convertCentsToDollars(
                                    order?.netAmount?.taxMoney?.amount ?? 0n,
                                )}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xl font-semibold">
                            <span>Total</span>
                            <span>
                                $
                                {convertCentsToDollars(
                                    order?.totalMoney?.amount ?? 0n,
                                )}
                            </span>
                        </div>
                    </div>

                    {order && order.id && !loading && !error && (
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <PaymentMethodPanel
                                order={order}
                                onPaid={handlePaid}
                            />
                        </div>
                    )}

                    <PluginHost mount={PluginUIMountPoint.CHECKOUT_FOOTER} />
                </aside>
            </div>
        </div>
    );
}
