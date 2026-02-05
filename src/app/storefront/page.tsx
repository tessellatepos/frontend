"use client";
import ItemCard from "@/components/ItemCard";
import Cart from "@/components/Cart";
import {useEffect, useState} from "react";
import type { squareItem, squareCartItem } from "@tessellate/common/src/squareTypes";
// import { configDotenv } from "dotenv";
import {Spinner} from "@/components/ui/spinner.tsx";
import { Logger } from "@origranot/ts-logger";

const logger = new Logger();

// configDotenv();


export default function Storefront() {
    const [cartItems, setCartItems] = useState<squareCartItem[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [items, setItems] = useState<squareItem[]>([]);

    async function fetchItemsResponse() {
        setLoading(true);
        const backendUrl = "http://localhost:3000/";
        //L5913KTSS159H
        const response = await fetch(`${backendUrl}items/by-location/`);
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

    const addToCart = (newItem: squareCartItem) => {
        const enriched: squareCartItem = { ...newItem };

        if (!enriched.parent) {
            const parent = items.find((p) =>
                p.variations?.some((v) => v.itemId === enriched.itemId)
            );
            if (parent) enriched.parent = { id: parent.id, name: parent.name };
        }

        const toAdd: squareCartItem = { ...enriched, quantity: 1n };

        setCartItems((prev) => {
            const exists = prev.some((item) => item.itemId === enriched.itemId);

            if (exists) {
                return prev.map((item) =>
                    item.itemId === enriched.itemId
                        ? { ...item, quantity: (item.quantity ?? 0n) + 1n }
                        : item
                );
            }

            return [...prev, toAdd];
        });
    };

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
                                // if the parent has exactly one variation, build a squareCartItem and pass parent info
                                if ((item.variations?.length ?? 0) === 1) {
                                    const v = item.variations![0];
                                    const cartItem: squareCartItem = {
                                        ...v,
                                        itemId: v.itemId,
                                        imageURL: item.imageURLs?.[0] ?? "",
                                        parent: { id: item.id, name: item.name },
                                    };

                                    return (
                                        <div key={item.id}>
                                            <ItemCard item={cartItem} onAdd={addToCart} />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.id}>
                                        <ItemCard parentItem={item} onAdd={addToCart} />
                                    </div>
                                );
                            })}
                    </div>
                    )}
                </main>
                <aside className="overflow-auto overscroll-auto no-scrollbar">
                    <Cart items={cartItems} setItems={setCartItems} />
                </aside>
            </div>
        </section>
    );
}