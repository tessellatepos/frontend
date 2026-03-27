import CartItem from "@/components/CartItem";
import { useCart } from "@/utils/cart/CartContext";
import type {
    squareCartItem,
    squareOrder,
} from "@tessellatepos/common/src/types/squareTypes";
import { useEffect, useState } from "react";
import { Logger } from "tslog";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { useOrdersStore } from "@/stores/order/useOrdersStore.ts";

const logger = new Logger();

export default function CartPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [order, setOrder] = useState<squareOrder>();
    const { locationId, backendUrl } = useSettingsStore();
    const { discounts } = useOrdersStore();

    const { getItems } = useCart();

    async function updateOrderStatus() {
        console.log(backendUrl, loading, error, order, errorMessage);
    }

    async function createOrder() {
        setLoading(true);
        const order: squareOrder = {
            lineItems: getItems(),
            locationId,
            discounts,
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
            const orderRes: squareOrder = await response.json();

            logger.debug("Fetched Order:", orderRes);

            if (orderRes) {
                setOrder(orderRes);
                setLoading(false);
            } else {
                setErrorMessage("No order found in backend response");
                throw new Error("No order found in backend response");
            }
        }
    }

    useEffect(() => {
        const doFetch = async () => {
            await createOrder();
        };
        void doFetch();
    }, []);

    return (
        <div>
            <div>
                {order &&
                    order.lineItems &&
                    order.lineItems.map((item: squareCartItem) => (
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
