"use client";
import { useEffect, useState } from "react";
import type { CartItem, Item } from "@tessellatepos/sdk";
import type { IConfigDevice } from "@tessellatepos/common";
// import { configDotenv } from "dotenv";
import { Logger } from "tslog";
import ItemCard from "@/components/ItemCard.tsx";
import Cart from "@/components/Cart.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useParams } from "react-router";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

const logger = new Logger();

// configDotenv();

export default function Storefront() {
    const [loading, setLoading] = useState<boolean>(true);
    const [items, setItems] = useState<Item[]>([]);
    const { deviceId } = useParams();
    const { setLocationId, backendUrl, setDeviceId } = useSettingsStore();

    useEffect(() => {
        async function fetchDeviceConfig(): Promise<string> {
            if (!deviceId) {
                throw new Error("Device ID is missing");
            }

            setDeviceId(deviceId);

            const response = await fetch(
                `${backendUrl}/api/v1/config/devices/${deviceId}`,
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch device configurations from backend",
                );
            }

            const deviceConfig: IConfigDevice = await response.json();

            if (!deviceConfig) {
                throw new Error(
                    "No device configurations found in backend response",
                );
            }

            if (!deviceConfig.square_location) {
                throw new Error("Failed to fetch square location");
            }

            logger.debug(
                "Fetched device config with location:",
                deviceConfig.square_location,
            );
            setLocationId(deviceConfig.square_location);
            return deviceConfig.square_location;
        }

        async function fetchItemsResponse() {
            const locationId = await fetchDeviceConfig();
            setLoading(true);
            const response = await fetch(
                `${backendUrl}/api/v1/items/by-location/${locationId}`,
            );
            if (!response.ok) {
                throw new Error("Failed to fetch items from backend");
            }

            const items: Item[] = await response.json();

            logger.debug("Fetched items:", items);

            if (items) {
                setItems(items);
                setLoading(false);
            } else {
                throw new Error("No items found in backend response");
            }
        }
        void fetchItemsResponse();
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="w-full min-h-screen dark:bg-gray-900">
            <div className="grid grid-cols-[5fr_2fr] h-screen w-full">
                <main className="overflow-auto overscroll-auto no-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="m-4 grid grid-cols-3 gap-4 auto-rows-max">
                            {items.map((item) => {
                                // if the parent has exactly one variation, build a CartItem and pass parent info
                                if ((item.variations?.length ?? 0) === 1) {
                                    const v = item.variations![0];
                                    const cartItem: CartItem = {
                                        ...v,
                                        itemId: v.itemId,
                                        imageURL: item.imageURLs?.[0] ?? "",
                                        parent: {
                                            id: item.id,
                                            name: item.name,
                                        },
                                    };

                                    return (
                                        <div key={item.id}>
                                            <ItemCard item={cartItem} />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.id}>
                                        <ItemCard parentItem={item} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
                <aside className="overflow-auto overscroll-auto no-scrollbar">
                    <Cart />
                </aside>
            </div>
        </section>
    );
}
