import { useEffect } from "react";
import { Link } from "react-router";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { useDashboardStore } from "@/stores/dashboard/useDashboardStore.ts";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";
import { meetsRole, roleHasScope } from "@/utils/scopes.ts";
import { settingsPath } from "@/app/settings/tabs.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { formatMoney } from "./format.ts";

function Card({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded border p-4">
            <h2 className="mb-2 text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl">{value}</div>
        </div>
    );
}

function SetupChecklist() {
    const setup = useAuthStore((s) => s.setup);
    const hasInvitedUser = useDashboardStore((s) => s.hasInvitedUser);
    if (!setup) return null;

    // Links open the Settings tab that does the work; no controls live here.
    const items: { label: string; done: boolean; to: string }[] = [
        { label: "Finish setup", done: !setup.needsSetup, to: "/setup" },
    ];
    if (setup.provider === "square") {
        items.push({
            label: "Connect Square",
            done: setup.squareConnected,
            to: settingsPath("providers"),
        });
    }
    if (hasInvitedUser !== null) {
        items.push({
            label: "Invite a user",
            done: hasInvitedUser,
            to: settingsPath("users"),
        });
    }
    if (items.every((i) => i.done)) return null;

    return (
        <Card title="Get set up">
            <ul className="flex flex-col gap-1">
                {items.map((i) => (
                    <li key={i.label}>
                        <span aria-hidden>{i.done ? "✓ " : "○ "}</span>
                        {i.done ? (
                            <span className="text-gray-500 line-through">
                                {i.label}
                            </span>
                        ) : (
                            <Link
                                to={i.to}
                                className="text-blue-600 underline">
                                {i.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );
}

export default function Dashboard() {
    const user = useAuthStore((s) => s.user);
    const {
        summary,
        locations,
        locationId,
        status,
        load,
        restoreLocation,
        setLocation,
    } = useDashboardStore();
    const canRead = roleHasScope(user?.role, "dashboard:read");
    const canListUsers = roleHasScope(user?.role, "users:read");
    const userId = user?.id ?? "";

    useEffect(() => {
        if (userId) restoreLocation(userId);
    }, [userId, restoreLocation]);

    useEffect(() => {
        if (canRead && userId) void load(canListUsers);
    }, [canRead, canListUsers, userId, locationId, load]);

    if (!canRead) {
        return (
            <div className="p-5">
                <h1 className="text-3xl">Dashboard</h1>
                <p className="mt-3 text-gray-600">
                    Your role does not include the dashboard.
                </p>
            </div>
        );
    }

    const locationName = (id: string) =>
        locations.find((l) => l.id === id)?.name ?? id;

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl">Dashboard</h1>
                {locations.length > 1 && (
                    <label className="flex items-center gap-2 text-sm">
                        Location
                        <select
                            value={locationId}
                            onChange={(e) =>
                                setLocation(userId, e.target.value)
                            }
                            className="rounded border px-2 py-1">
                            <option value="">All locations</option>
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
            </div>

            {status === "error" && (
                <p
                    role="alert"
                    className="text-red-600">
                    Could not load the dashboard. Try again.
                </p>
            )}
            {!summary && status !== "error" && <Spinner />}

            <SetupChecklist />

            {summary && (
                <>
                    <Card title="Today">
                        {summary.totals ? (
                            <div className="grid grid-cols-4 gap-4">
                                <Stat
                                    label="Sales"
                                    value={formatMoney(
                                        summary.totals.salesTotal,
                                    )}
                                />
                                <Stat
                                    label="Orders"
                                    value={summary.totals.orderCount}
                                />
                                <Stat
                                    label="Average order"
                                    value={formatMoney(
                                        summary.totals.averageOrder,
                                    )}
                                />
                                <Stat
                                    label="Open orders"
                                    value={summary.openOrders}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                Locations sell in different currencies, so there
                                is no combined total. See each location below.
                            </p>
                        )}
                        {!locationId && summary.locations.length > 0 && (
                            <table className="mt-4 w-full text-left text-sm">
                                <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>Sales</th>
                                        <th>Orders</th>
                                        <th>Average</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.locations.map((l) => (
                                        <tr
                                            key={`${l.locationId}-${l.currency}`}>
                                            <td>
                                                {locationName(l.locationId)}
                                            </td>
                                            <td>{formatMoney(l.salesTotal)}</td>
                                            <td>{l.orderCount}</td>
                                            <td>
                                                {formatMoney(l.averageOrder)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>

                    <div className="grid grid-cols-2 gap-5">
                        <Card title="Payment methods">
                            {summary.paymentMethods.length === 0 ? (
                                <p className="text-sm text-gray-600">
                                    No payments yet today.
                                </p>
                            ) : (
                                <ul>
                                    {summary.paymentMethods.map((p) => (
                                        <li
                                            key={`${p.type}-${p.currency}`}
                                            className="flex justify-between">
                                            <span>
                                                {p.type
                                                    .replaceAll("_", " ")
                                                    .toLowerCase()}{" "}
                                                ({p.count})
                                            </span>
                                            <span>{formatMoney(p.total)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>

                        <Card title="Health">
                            <ul className="text-sm">
                                <li>
                                    Provider: {summary.health.provider.id},{" "}
                                    {summary.health.provider.connected
                                        ? "connected"
                                        : "not connected"}
                                    {meetsRole(user?.role, "owner") && (
                                        <>
                                            {" · "}
                                            <Link
                                                to={settingsPath("providers")}
                                                className="text-blue-600 underline">
                                                Manage
                                            </Link>
                                        </>
                                    )}
                                </li>
                                <li>
                                    Catalog last synced:{" "}
                                    {summary.health.catalogLastSyncedAt
                                        ? new Date(
                                              summary.health
                                                  .catalogLastSyncedAt,
                                          ).toLocaleString()
                                        : "never"}
                                </li>
                                <li>
                                    Devices paired:{" "}
                                    {summary.health.devicesPaired}
                                </li>
                                <li>
                                    Plugins loaded:{" "}
                                    {summary.health.pluginsLoaded}
                                </li>
                            </ul>
                        </Card>
                    </div>

                    <Card title="Recent orders">
                        {summary.recentOrders.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                No orders yet.
                            </p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr>
                                        <th>Created</th>
                                        <th>Source</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.recentOrders.map((o) => (
                                        <tr key={o.referenceId}>
                                            <td>
                                                {o.createdAt
                                                    ? new Date(
                                                          o.createdAt,
                                                      ).toLocaleString()
                                                    : "—"}
                                            </td>
                                            <td>{o.source ?? "POS"}</td>
                                            <td>
                                                {locationName(o.locationId)}
                                            </td>
                                            <td>
                                                {o.state?.toLowerCase() ?? "—"}
                                            </td>
                                            <td>{formatMoney(o.totalMoney)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </>
            )}

            {/* Online orders awaiting pickup: reserved for the gateway (G9/G10). */}
            <div data-slot="online-orders" />

            <PluginHost mount={PluginUIMountPoint.DASHBOARD_WIDGET} />
        </div>
    );
}
