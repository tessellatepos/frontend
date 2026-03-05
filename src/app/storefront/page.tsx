"use client";
import { useEffect, useState } from "react";
import type {
    squareCartItem,
    squareItem,
} from "@tessellate-pos/common/src/types/squareTypes";
// import { configDotenv } from "dotenv";
import { Logger } from "tslog";
import ItemCard from "@/components/ItemCard.tsx";
import Cart from "@/components/Cart.tsx";
import { CartProvider } from "@/utils/cart/CartProvider.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

const logger = new Logger();

// configDotenv();

export default function Storefront() {
    const [loading, setLoading] = useState<boolean>(true);
    const [items, setItems] = useState<squareItem[]>([]);

    async function fetchItemsResponse() {
        setLoading(true);
        const backendUrl = "http://localhost:3000/";
        //L5913KTSS159H
        const response =
            await fetch(`${backendUrl}/api/v1/items/by-location/L5913KTSS159H
`);
        if (!response.ok) {
            throw new Error("Failed to fetch items from backend");
        }

        const items: squareItem[] = await response.json();

        logger.debug("Fetched items:", items);

        if (items) {
            setItems(items);
            setLoading(false);
        } else {
            throw new Error("No items found in backend response");
        }
    }

    useEffect(() => {
        // call async fetch helper
        const doFetch = async () => {
            await fetchItemsResponse();
        };
        void doFetch();
    }, []);

    return (
        <section className="w-full min-h-screen dark:bg-gray-900">
            <CartProvider>
                <div className="grid grid-cols-[5fr_2fr] h-screen w-full">
                    <main className="overflow-auto overscroll-auto no-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner />
                            </div>
                        ) : (
                            <div className="m-4 grid grid-cols-3 gap-4 auto-rows-max">
                                {items.map((item) => {
                                    // if the parent has exactly one variation, build a squareCartItem and pass parent info
                                    if ((item.variations?.length ?? 0) === 1) {
                                        const v = item.variations![0];
                                        const cartItem: squareCartItem = {
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
            </CartProvider>
        </section>
    );
}
