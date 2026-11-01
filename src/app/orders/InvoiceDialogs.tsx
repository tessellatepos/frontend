import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { FormField } from "@/components/FormField.tsx";
import { listProcessors } from "@/app/settings/pages/payments/api.ts";
import { defaultDueDate } from "@/app/settings/pages/payments/format.ts";
import {
    cancelInvoice,
    createInvoice,
    type Customer,
    failureMessage,
    type InvoiceRequest,
    type OrderDetail,
    type ProcessorStatus,
    searchCustomers,
} from "./api.ts";
import { customerLabel, deliveryNeed } from "./format.ts";

interface CreateProps {
    open: boolean;
    order: OrderDetail;
    onClose: () => void;
    onCreated: () => void;
}

/** Dialog form that invoices an order; the server's refusals are shown as is. */
export function CreateInvoiceDialog({ open, ...props }: CreateProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => !next && props.onClose()}>
            <DialogContent>{open && <CreateForm {...props} />}</DialogContent>
        </Dialog>
    );
}

function CreateForm({ order, onClose, onCreated }: Omit<CreateProps, "open">) {
    const [processors, setProcessors] = useState<ProcessorStatus[] | null>(
        null,
    );
    const [processor, setProcessor] = useState("");
    const [delivery, setDelivery] =
        useState<InvoiceRequest["delivery"]>("EMAIL");
    const [dueDate, setDueDate] = useState(defaultDueDate(new Date(), 14));
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [matches, setMatches] = useState<Customer[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                const list = (await listProcessors(order.locationId)).filter(
                    (p) => p.enabled && p.capabilities.invoice,
                );
                setProcessors(list);
                setProcessor(list[0]?.id ?? "");
            } catch (err) {
                setProcessors([]);
                setError(failureMessage(err));
            }
        })();
    }, [order.locationId]);

    useEffect(() => {
        if (order.customerId) return;
        const timer = setTimeout(() => {
            searchCustomers(search.trim())
                .then(setMatches)
                .catch(() => setMatches([]));
        }, 250);
        return () => clearTimeout(timer);
    }, [search, order.customerId]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError("");
        setBusy(true);
        try {
            await createInvoice(order.referenceId ?? (order.id as string), {
                processor,
                delivery,
                due_date: dueDate,
                ...(message.trim() ? { message: message.trim() } : {}),
                ...(customer ? { customer_id: customer.id } : {}),
            });
            onCreated();
            onClose();
        } catch (err) {
            setError(failureMessage(err));
        } finally {
            setBusy(false);
        }
    }

    const need = deliveryNeed(delivery);

    return (
        <form
            onSubmit={(e) => void submit(e)}
            className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Create invoice</DialogTitle>
                <DialogDescription>
                    The processor emails or texts the customer a payable
                    invoice, or gives you a link to share.
                </DialogDescription>
            </DialogHeader>
            {processors && processors.length === 0 ? (
                <p
                    role="status"
                    className="text-sm">
                    No enabled payment processor at this location can send
                    invoices. Enable one in Settings, Payments.
                </p>
            ) : (
                <>
                    <label className="flex flex-col gap-1 text-sm font-medium">
                        Processor
                        <select
                            value={processor}
                            onChange={(e) => setProcessor(e.target.value)}
                            className="rounded border px-2 py-1 font-normal">
                            {(processors ?? []).map((p) => (
                                <option
                                    key={p.id}
                                    value={p.id}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <fieldset className="flex flex-col gap-2">
                        <legend className="text-sm font-medium">
                            Customer
                        </legend>
                        {order.customerId ? (
                            <p className="text-sm">
                                The order&apos;s customer receives the invoice.
                            </p>
                        ) : (
                            <>
                                <FormField
                                    label="Find a customer"
                                    value={customer ? "" : search}
                                    onChange={(e) => {
                                        setCustomer(null);
                                        setSearch(e.target.value);
                                    }}
                                    placeholder="Name, email or phone"
                                />
                                {customer ? (
                                    <p className="text-sm">
                                        Selected:{" "}
                                        <strong>
                                            {customerLabel(customer)}
                                        </strong>
                                        {customer.email &&
                                            ` (${customer.email})`}
                                    </p>
                                ) : (
                                    <ul
                                        aria-label="Matching customers"
                                        className="max-h-36 overflow-y-auto rounded border text-sm">
                                        {matches.length === 0 && (
                                            <li className="p-2 text-gray-500">
                                                No customers found.
                                            </li>
                                        )}
                                        {matches.map((c) => (
                                            <li key={c.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCustomer(c)
                                                    }
                                                    className="w-full p-2 text-left hover:bg-gray-100">
                                                    {customerLabel(c)}
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        {c.email ||
                                                            c.phone_number}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </fieldset>
                    <label className="flex flex-col gap-1 text-sm font-medium">
                        Delivery
                        <select
                            value={delivery}
                            onChange={(e) =>
                                setDelivery(
                                    e.target
                                        .value as InvoiceRequest["delivery"],
                                )
                            }
                            className="rounded border px-2 py-1 font-normal">
                            <option value="EMAIL">Email</option>
                            <option value="SMS">Text message</option>
                            <option value="SHARE_MANUALLY">
                                Share the link myself
                            </option>
                        </select>
                        {need && (
                            <span className="text-xs font-normal text-gray-500">
                                The customer needs {need}.
                            </span>
                        )}
                    </label>
                    <FormField
                        label="Due date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                    <label className="flex flex-col gap-1 text-sm font-medium">
                        Message (optional)
                        <textarea
                            value={message}
                            maxLength={500}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="rounded border px-2 py-1 font-normal"
                        />
                    </label>
                </>
            )}
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}>
                    Close
                </Button>
                <Button
                    type="submit"
                    disabled={busy || !processor || !dueDate}>
                    Create invoice
                </Button>
            </DialogFooter>
        </form>
    );
}

interface CancelProps {
    open: boolean;
    orderId: string;
    onClose: () => void;
    onCanceled: () => void;
}

/** Confirms before canceling; a canceled invoice cannot be revived. */
export function CancelInvoiceDialog({
    open,
    orderId,
    onClose,
    onCanceled,
}: CancelProps) {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function confirm() {
        setBusy(true);
        setError("");
        try {
            await cancelInvoice(orderId);
            onCanceled();
            onClose();
        } catch (err) {
            setError(failureMessage(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    setError("");
                    onClose();
                }
            }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel this invoice?</DialogTitle>
                    <DialogDescription>
                        The customer can no longer pay it. You can issue a new
                        invoice afterwards.
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}>
                        Keep invoice
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={() => void confirm()}>
                        Cancel invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
