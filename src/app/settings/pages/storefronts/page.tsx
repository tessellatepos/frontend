import { useCallback, useEffect, useState } from "react";
import type { Location } from "@tessellatepos/sdk";
import { apiFetch } from "@/utils/apiFetch.ts";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";

interface IStorefrontList {
    canManage: boolean;
    storefronts: Location[];
}

export default function Storefronts() {
    const isOwner = useAuthStore((s) => s.user?.role === "owner");
    const [list, setList] = useState<IStorefrontList>();
    const [name, setName] = useState("");
    const [currency, setCurrency] = useState("CAD");
    const [country, setCountry] = useState("CA");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const response = await apiFetch(`/api/v1/config/storefronts`);
            if (!response.ok) throw new Error(`returned ${response.status}`);
            setList((await response.json()) as IStorefrontList);
        } catch (err) {
            console.error("Failed to load storefronts", err);
            setError("Could not load storefronts.");
        }
    }, []);

    useEffect(() => {
        const doFetch = async () => {
            await load();
        };
        void doFetch();
    }, [load]);

    async function create() {
        setError("");
        const response = await apiFetch(`/api/v1/config/storefronts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, currency, country }),
        });
        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as {
                message?: string;
            };
            setError(body.message ?? "Could not create the storefront.");
            return;
        }
        setName("");
        await load();
    }

    async function remove(id: string) {
        setError("");
        const response = await apiFetch(`/api/v1/config/storefronts/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as {
                message?: string;
            };
            setError(body.message ?? "Could not delete the storefront.");
            return;
        }
        await load();
    }

    return (
        <div className={`flex p-5 w-full h-full flex-col gap-5`}>
            <h1 className={`text-2xl`}>Storefronts</h1>
            <p className={`text-sm text-gray-500 max-w-2xl`}>
                Storefronts are the selling surfaces tied to a location.{" "}
                {list?.canManage
                    ? "With the local provider you can create and delete them for testing."
                    : "With this provider they come from its locations and are read-only."}
            </p>

            {list?.canManage && isOwner && (
                <form
                    className={`flex gap-2 items-end`}
                    onSubmit={(e) => {
                        e.preventDefault();
                        void create();
                    }}>
                    <label className={`flex flex-col text-sm`}>
                        Name
                        <input
                            className={`border rounded px-3 py-2`}
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <label className={`flex flex-col text-sm`}>
                        Currency
                        <input
                            className={`border rounded px-3 py-2 w-24`}
                            maxLength={3}
                            value={currency}
                            onChange={(e) =>
                                setCurrency(e.target.value.toUpperCase())
                            }
                        />
                    </label>
                    <label className={`flex flex-col text-sm`}>
                        Country
                        <input
                            className={`border rounded px-3 py-2 w-24`}
                            maxLength={2}
                            value={country}
                            onChange={(e) =>
                                setCountry(e.target.value.toUpperCase())
                            }
                        />
                    </label>
                    <button
                        className={`bg-blue-500 text-white px-4 py-2 rounded`}
                        type="submit">
                        Create storefront
                    </button>
                </form>
            )}

            {error && <p className={`text-red-600`}>{error}</p>}

            <ul className={`flex flex-col gap-2 max-w-2xl`}>
                {list?.storefronts.map((storefront) => (
                    <li
                        key={storefront.id}
                        className={`flex items-center justify-between border rounded px-4 py-2`}>
                        <span>
                            {storefront.name}{" "}
                            <span className={`text-sm text-gray-500`}>
                                ({storefront.id}, {storefront.currency})
                            </span>
                        </span>
                        {list.canManage &&
                            isOwner &&
                            storefront.id.startsWith("local-") && (
                                <button
                                    className={`text-red-600`}
                                    onClick={() => void remove(storefront.id)}>
                                    Delete
                                </button>
                            )}
                    </li>
                ))}
                {list?.storefronts.length === 0 && (
                    <li className={`text-gray-500`}>No storefronts yet.</li>
                )}
            </ul>
        </div>
    );
}
