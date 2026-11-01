import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { formatMoney } from "@/app/dashboard/format.ts";
import { statusLabel } from "@/app/settings/pages/payments/format.ts";
import { apiFetch } from "@/utils/apiFetch.ts";
import {
    failureMessage,
    listOnlineOrders,
    type OnlineOrder,
    type OrderFilters,
    orderKey,
} from "./api.ts";
import { shortReference } from "./format.ts";

interface Location {
    id: string;
    name: string;
}

const STATUSES = ["unpaid", "processing", "paid", "failed", "refunded"];

/** Online orders at one location, with their payment status. */
export default function OnlineOrders() {
    const [locations, setLocations] = useState<Location[] | null>(null);
    const [locationId, setLocationId] = useState("");
    const [filters, setFilters] = useState<OrderFilters>({
        source: "",
        paymentStatus: "",
        processor: "",
    });
    const [orders, setOrders] = useState<OnlineOrder[] | null>(null);
    const [cursor, setCursor] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        void (async () => {
            try {
                const res = await apiFetch("/api/v1/locations");
                if (!res.ok) throw new Error(String(res.status));
                const list = (await res.json()) as Location[];
                setLocations(list);
                setLocationId(list[0]?.id ?? "");
            } catch {
                setLocations([]);
                setError("Could not load locations. Try again.");
            }
        })();
    }, []);

    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!locationId) return;
        let stale = false;
        void (async () => {
            try {
                const page = await listOnlineOrders(locationId, filters);
                if (stale) return;
                setOrders(page.orders);
                setCursor(page.next_cursor);
                setError("");
            } catch (err) {
                if (stale) return;
                setOrders([]);
                setCursor(null);
                setError(failureMessage(err));
            }
        })();
        return () => {
            stale = true;
        };
    }, [locationId, filters, attempt]);

    async function loadMore(after: string) {
        try {
            const page = await listOnlineOrders(locationId, filters, after);
            setOrders((prev) => [...(prev ?? []), ...page.orders]);
            setCursor(page.next_cursor);
        } catch (err) {
            setError(failureMessage(err));
        }
    }

    const setFilter = (change: Partial<OrderFilters>) => {
        setOrders(null);
        setFilters((f) => ({ ...f, ...change }));
    };

    return (
        <div className="flex w-full flex-col gap-4 p-5">
            <h1 className="text-4xl">Online orders</h1>
            <p className="max-w-2xl text-sm text-gray-600">
                Orders placed through an online store or API credential, and any
                order with a payment link or invoice.
            </p>
            <div className="flex flex-wrap items-end gap-3">
                {locations && locations.length > 1 && (
                    <label className="flex flex-col gap-1 text-sm">
                        Location
                        <select
                            value={locationId}
                            onChange={(e) => {
                                setOrders(null);
                                setLocationId(e.target.value);
                            }}
                            className="rounded border px-2 py-1">
                            {locations.map((l) => (
                                <option
                                    key={l.id}
                                    value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="flex flex-col gap-1 text-sm">
                    Payment
                    <select
                        value={filters.paymentStatus}
                        onChange={(e) =>
                            setFilter({ paymentStatus: e.target.value })
                        }
                        className="rounded border px-2 py-1">
                        <option value="">Any status</option>
                        {STATUSES.map((s) => (
                            <option
                                key={s}
                                value={s}>
                                {statusLabel(s)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Processor
                    <input
                        value={filters.processor}
                        onChange={(e) =>
                            setFilter({ processor: e.target.value.trim() })
                        }
                        placeholder="e.g. square"
                        className="rounded border px-2 py-1"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Source
                    <input
                        value={filters.source}
                        onChange={(e) =>
                            setFilter({ source: e.target.value.trim() })
                        }
                        placeholder="Credential name"
                        className="rounded border px-2 py-1"
                    />
                </label>
            </div>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}{" "}
                    <button
                        className="underline"
                        onClick={() => {
                            setOrders(null);
                            setAttempt((n) => n + 1);
                        }}>
                        Retry
                    </button>
                </p>
            )}
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Order</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">Payment</th>
                        <th className="p-2">Processor</th>
                        <th className="p-2">Total</th>
                        <th className="p-2">Created</th>
                    </tr>
                </thead>
                <tbody>
                    {orders?.map((o) => (
                        <tr
                            key={orderKey(o)}
                            className="border-b">
                            <td className="p-2">
                                <Link
                                    to={`/orders/${encodeURIComponent(orderKey(o))}`}
                                    className="underline">
                                    {shortReference(orderKey(o))}
                                </Link>
                            </td>
                            <td className="p-2">{o.source?.name || "—"}</td>
                            <td className="p-2">
                                {statusLabel(o.payment_status)}
                            </td>
                            <td className="p-2">
                                {o.latest_payment?.processor ?? "—"}
                            </td>
                            <td className="p-2">{formatMoney(o.totalMoney)}</td>
                            <td className="p-2">
                                {o.createdAt
                                    ? new Date(o.createdAt).toLocaleString()
                                    : "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {orders === null && !error && <Spinner />}
            {orders?.length === 0 && !error && (
                <p>
                    {filters.paymentStatus ||
                    filters.processor ||
                    filters.source
                        ? "No online orders match these filters."
                        : "No online orders yet."}
                </p>
            )}
            {cursor && (
                <div>
                    <Button
                        variant="outline"
                        onClick={() => void loadMore(cursor)}>
                        Load more
                    </Button>
                </div>
            )}
        </div>
    );
}
