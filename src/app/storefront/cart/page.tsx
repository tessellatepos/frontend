import CartItem from "@/components/CartItem";
import type { CartItem as CartItemType, Order } from "@tessellatepos/sdk";
import { useCallback, useEffect, useState } from "react";
import { Logger } from "tslog";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { useOrdersStore } from "@/stores/order/useOrdersStore.ts";
import { useCartStore } from "@/stores/cart/useCartStore.ts";

const logger = new Logger();

export default function CartPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [order, setOrder] = useState<Order>();
    const { locationId, backendUrl, deviceId } = useSettingsStore();
    const { discounts } = useOrdersStore();
    const { cart } = useCartStore();

    async function updateOrderStatus() {
        console.log(backendUrl, loading, error, order, errorMessage);
    }

    const createOrder = useCallback(async () => {
        setLoading(true);
        const order: Order = {
            lineItems: cart.getItems(),
            locationId,
            discounts,
            //TODO remove development reference/indempotency key
            referenceId: "542d6eb3-9c54-4a31-a1f5-b5249144163d",
            source: {
                name: `Tessellate POS - From Device:${deviceId}`,
            },
        };
        const response = await fetch(`${backendUrl}/api/v1/orders/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order, (_, v) =>
                typeof v === "bigint" ? v.toString() : v,
            ),
        });

        if (response.status != 200) {
            const eMessage: string = await response.json();
            setError(true);
            setErrorMessage(eMessage);
        } else {
            const orderRes: Order = await response.json();

            logger.debug("Fetched Order:", orderRes);

            if (orderRes) {
                setOrder(orderRes);
                setLoading(false);
            } else {
                setErrorMessage("No order found in backend response");
                throw new Error("No order found in backend response");
            }
        }
    }, [cart, locationId, discounts, deviceId, backendUrl]);

    useEffect(() => {
        const doFetch = async () => {
            await createOrder();
        };
        void doFetch();
    }, [createOrder]);

    return (
        <div>
            <div>
                {order &&
                    order.lineItems &&
                    order.lineItems.map((item: CartItemType) => (
                        <div key={item.itemId ?? item.name}>
                            <CartItem item={item} />
                        </div>
                    ))}
            </div>
            <div>
                <p>
                    Subtotal:
                    {order &&
                        order.netAmount &&
                        order.netAmount &&
                        order.netAmount.totalMoney &&
                        order.netAmount.totalMoney.amount}
                </p>
                <p>
                    Tax Amount:
                    {order &&
                        order.netAmount &&
                        order.netAmount?.taxMoney &&
                        order.netAmount?.taxMoney.amount}
                </p>
                <p>
                    Total:
                    {order && order.totalMoney && order.totalMoney.amount}
                </p>
            </div>
            <div>
                <button onClick={() => updateOrderStatus()}>Credit Card</button>
            </div>
        </div>
    );
}
