import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { formatMoney } from "@/app/dashboard/format.ts";
import {
    invoiceIsOpen,
    statusLabel,
} from "@/app/settings/pages/payments/format.ts";
import { roleHasScope } from "@/utils/scopes.ts";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import {
    type Attempt,
    failureMessage,
    getCustomer,
    getOnlineOrder,
    type OrderDetail,
} from "./api.ts";
import { customerLabel } from "./format.ts";
import { CancelInvoiceDialog, CreateInvoiceDialog } from "./InvoiceDialogs.tsx";

const when = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString() : "—";

/** One online order: payment attempts, its invoice, and invoice actions. */
export default function OnlineOrderDetail() {
    const { orderId = "" } = useParams();
    const role = useAuthStore((s) => s.user?.role);
    const canWrite = roleHasScope(role, "payments:write");
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [customer, setCustomer] = useState("");
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [canceling, setCanceling] = useState(false);

    const [attempt, setAttempt] = useState(0);
    const reload = () => setAttempt((n) => n + 1);

    useEffect(() => {
        void (async () => {
            try {
                const loaded = await getOnlineOrder(orderId);
                setOrder(loaded);
                setError("");
                const found = loaded.customerId
                    ? await getCustomer(loaded.customerId)
                    : null;
                setCustomer(
                    found ? customerLabel(found) : (loaded.customerId ?? ""),
                );
            } catch (err) {
                setError(failureMessage(err));
            }
        })();
    }, [orderId, attempt]);

    if (!order) {
        return (
            <div className="flex flex-col gap-3 p-5">
                <BackLink />
                {error ? (
                    <p
                        role="alert"
                        className="text-red-600">
                        {error}
                    </p>
                ) : (
                    <Spinner />
                )}
            </div>
        );
    }

    const invoice = order.invoice;
    const invoiceOpen = !!invoice && invoiceIsOpen(invoice.status);
    const livePayment = order.payments.some((p) =>
        ["created", "draft", "sent", "viewed", "overdue"].includes(p.status),
    );
    const canInvoice =
        canWrite &&
        order.state === "OPEN" &&
        order.payment_status !== "paid" &&
        order.payment_status !== "refunded" &&
        !invoiceOpen;

    return (
        <div className="flex w-full flex-col gap-5 p-5">
            <BackLink />
            <div className="flex items-baseline justify-between">
                <h1 className="text-3xl">
                    Order{" "}
                    <code className="text-2xl">
                        {order.referenceId ?? order.id}
                    </code>
                </h1>
                <span className="text-lg">
                    {statusLabel(order.payment_status)}
                </span>
            </div>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <dl className="grid max-w-xl grid-cols-[10rem_1fr] gap-y-1 text-sm">
                <dt className="text-gray-500">Source</dt>
                <dd>{order.source?.name || "—"}</dd>
                <dt className="text-gray-500">State</dt>
                <dd>{order.state ?? "—"}</dd>
                <dt className="text-gray-500">Total</dt>
                <dd>{formatMoney(order.totalMoney)}</dd>
                <dt className="text-gray-500">Customer</dt>
                <dd>{customer || "None on the order"}</dd>
                <dt className="text-gray-500">Created</dt>
                <dd>{when(order.createdAt)}</dd>
            </dl>

            <section
                aria-label="Invoice"
                className="flex flex-col gap-2 rounded border p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg">Invoice</h2>
                    <div className="flex gap-2">
                        {canInvoice && (
                            <Button
                                size="sm"
                                onClick={() => setCreating(true)}>
                                Create invoice
                            </Button>
                        )}
                        {canWrite && invoiceOpen && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setCanceling(true)}>
                                Cancel invoice
                            </Button>
                        )}
                    </div>
                </div>
                {invoice ? (
                    <dl className="grid max-w-xl grid-cols-[10rem_1fr] gap-y-1 text-sm">
                        <dt className="text-gray-500">Status</dt>
                        <dd>{statusLabel(invoice.status)}</dd>
                        <dt className="text-gray-500">Processor</dt>
                        <dd>{invoice.processor}</dd>
                        <dt className="text-gray-500">Amount</dt>
                        <dd>{formatMoney(invoice.amount)}</dd>
                        <dt className="text-gray-500">Due date</dt>
                        <dd>{invoice.due_date ?? "—"}</dd>
                        <dt className="text-gray-500">Link</dt>
                        <dd>
                            {invoice.url ? (
                                <a
                                    href={invoice.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="break-all underline">
                                    Open invoice
                                </a>
                            ) : (
                                "—"
                            )}
                        </dd>
                    </dl>
                ) : (
                    <p className="text-sm text-gray-600">
                        This order has no invoice.
                    </p>
                )}
                {!canInvoice && canWrite && !invoiceOpen && (
                    <p className="text-xs text-gray-500">
                        {order.payment_status === "paid"
                            ? "Paid orders cannot be invoiced."
                            : order.state !== "OPEN"
                              ? "Only open orders can be invoiced."
                              : ""}
                    </p>
                )}
                {livePayment && !invoiceOpen && canInvoice && (
                    <p className="text-xs text-gray-500">
                        A payment link is still live; the server will ask you to
                        wait for it to expire before invoicing.
                    </p>
                )}
            </section>

            <section
                aria-label="Payment attempts"
                className="flex flex-col gap-2">
                <h2 className="text-lg">Payment attempts</h2>
                {order.payments.length === 0 ? (
                    <p className="text-sm text-gray-600">
                        No payment has been attempted yet.
                    </p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Kind</th>
                                <th className="p-2">Processor</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Expires / due</th>
                                <th className="p-2">Created</th>
                                <th className="p-2">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.payments.map((a) => (
                                <AttemptRow
                                    key={a.id}
                                    attempt={a}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <CreateInvoiceDialog
                open={creating}
                order={order}
                onClose={() => setCreating(false)}
                onCreated={() => reload()}
            />
            <CancelInvoiceDialog
                open={canceling}
                orderId={order.referenceId ?? order.id ?? orderId}
                onClose={() => setCanceling(false)}
                onCanceled={() => reload()}
            />
        </div>
    );
}

function BackLink() {
    return (
        <Link
            to="/orders"
            className="text-sm underline">
            Back to online orders
        </Link>
    );
}

function AttemptRow({ attempt }: { attempt: Attempt }) {
    return (
        <tr className="border-b">
            <td className="p-2 capitalize">{attempt.kind}</td>
            <td className="p-2">{attempt.processor}</td>
            <td className="p-2">{statusLabel(attempt.status)}</td>
            <td className="p-2">{formatMoney(attempt.amount)}</td>
            <td className="p-2">
                {attempt.kind === "invoice" && attempt.due_date
                    ? attempt.due_date
                    : when(attempt.expires_at)}
            </td>
            <td className="p-2">{when(attempt.created_at)}</td>
            <td className="p-2">
                {attempt.url ? (
                    <a
                        href={attempt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline">
                        Open
                    </a>
                ) : (
                    "—"
                )}
            </td>
        </tr>
    );
}
