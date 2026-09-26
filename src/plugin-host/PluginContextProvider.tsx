import { type ReactNode, useMemo } from "react";
import {
    createPluginApiClient,
    type PluginContext,
} from "@tessellatepos/plugin-sdk";
import { useCartStore } from "@/stores/cart/useCartStore.ts";
import { useOrdersStore } from "@/stores/order/useOrdersStore.ts";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { useNavigate } from "react-router";

interface Props {
    pluginName: string;
    children: (context: PluginContext) => ReactNode;
}

/**
 * Builds a PluginContext from the host's Zustand stores and React Router,
 * scoped to a single plugin. The context is recreated when store state
 * changes so plugins always see current values.
 */
export function PluginContextProvider({ pluginName, children }: Props) {
    const { cart, addQuantity, removeQuantity, removeItem, clearCart } =
        useCartStore();
    const { discounts, completedOrder } = useOrdersStore();
    const { locationId, deviceId, backendUrl } = useSettingsStore();
    const navigate = useNavigate();

    const api = useMemo(
        () => createPluginApiClient(backendUrl, pluginName),
        [backendUrl, pluginName],
    );

    const context = useMemo<PluginContext>(
        () => ({
            cart: {
                getItems: () => cart.getItems(),
                getTotal: () => cart.getTotal(),
                addQuantity,
                removeQuantity,
                removeItem,
                clearCart,
            },
            order: {
                discounts,
                completedOrder,
            },
            settings: {
                locationId,
                deviceId,
            },
            navigate: (path: string) => void navigate(path),
            api,
        }),
        [
            cart,
            addQuantity,
            removeQuantity,
            removeItem,
            clearCart,
            discounts,
            completedOrder,
            locationId,
            deviceId,
            navigate,
            api,
        ],
    );

    return <>{children(context)}</>;
}
