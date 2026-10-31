import type { Customer, CustomerPage } from "@tessellatepos/sdk";
import { apiFetch } from "@/utils/apiFetch.ts";
import {
    paymentsJson,
    paymentsRequest,
    type ProcessorStatus,
} from "@/app/settings/pages/payments/api.ts";

export { failureMessage } from "@/app/settings/pages/payments/api.ts";
export type { Customer, ProcessorStatus };

export type PaymentStatus =
    "unpaid" | "processing" | "paid" | "failed" | "refunded";

export interface WireMoney {
    amount: string;
    currency: string;
}

export interface Attempt {
    id: string;
    processor: string;
    kind: "checkout" | "invoice";
    status: string;
    url?: string;
    amount: WireMoney;
    due_date?: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    external_id?: string;
}

export interface Invoice {
    id: string;
    order_id: string;
    processor: string;
    status: string;
    url?: string;
    amount: WireMoney;
    due_date: string | null;
    created_at: string;
    updated_at: string;
}

/** An order as the payments screens get it (money arrives as strings). */
export interface OnlineOrder {
    id?: string;
    locationId: string;
    referenceId?: string | null;
    customerId?: string | null;
    source?: { name?: string | null };
    state?: string;
    createdAt?: string;
    totalMoney?: WireMoney;
    payment_status: PaymentStatus;
    latest_payment: Attempt | null;
    invoice: Invoice | null;
}

export interface OrderDetail extends OnlineOrder {
    invoiced_at: string | null;
    payments: Attempt[];
}

export interface OrderFilters {
    source: string;
    paymentStatus: string;
    processor: string;
}

export interface InvoiceRequest {
    processor: string;
    delivery: "EMAIL" | "SMS" | "SHARE_MANUALLY";
    due_date: string;
    message?: string;
    customer_id?: string;
}

/** The id the payments routes accept for an order. */
export const orderKey = (order: OnlineOrder): string =>
    (order.referenceId ?? order.id) as string;

export function listOnlineOrders(
    locationId: string,
    filters: OrderFilters,
    cursor?: string,
) {
    const query = new URLSearchParams({ location_id: locationId, limit: "25" });
    if (filters.source) query.set("source", filters.source);
    if (filters.paymentStatus)
        query.set("payment_status", filters.paymentStatus);
    if (filters.processor) query.set("processor", filters.processor);
    if (cursor) query.set("cursor", cursor);
    return paymentsRequest<{
        orders: OnlineOrder[];
        next_cursor: string | null;
    }>(`/orders?${query}`);
}

export const getOnlineOrder = (orderId: string) =>
    paymentsRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId)}`);

export const createInvoice = (orderId: string, input: InvoiceRequest) =>
    paymentsRequest<Invoice>(
        `/orders/${encodeURIComponent(orderId)}/invoice`,
        paymentsJson("POST", input),
    );

export const cancelInvoice = (orderId: string) =>
    paymentsRequest<Invoice>(
        `/orders/${encodeURIComponent(orderId)}/invoice/cancel`,
        paymentsJson("POST", {}),
    );

export async function searchCustomers(text: string): Promise<Customer[]> {
    const query = new URLSearchParams({ limit: "8" });
    if (text) query.set("text", text);
    const response = await apiFetch(`/api/v1/customers?${query}`);
    if (!response.ok) throw new Error(String(response.status));
    return ((await response.json()) as CustomerPage).customers;
}

export async function getCustomer(id: string): Promise<Customer | null> {
    const response = await apiFetch(
        `/api/v1/customers/${encodeURIComponent(id)}`,
    );
    return response.ok ? ((await response.json()) as Customer) : null;
}
