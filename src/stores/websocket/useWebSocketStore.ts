import { create } from "zustand";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { getDeviceToken } from "@/utils/apiFetch.ts";

/** Longest wait between reconnect attempts. */
export const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 3_000;

/**
 * The WebSocket URL for a backend. Browsers cannot set Authorization on a
 * WebSocket, so a device token travels as the `access_token` query parameter;
 * without one the staff session cookie authenticates the (same-origin) upgrade.
 */
export function buildWsUrl(
    backendUrl: string,
    origin: string,
    deviceToken: string | null,
): string {
    const base = new URL(backendUrl || origin);
    base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    base.pathname = "/ws";
    base.search = "";
    return (
        base.href +
        (deviceToken ? `?access_token=${encodeURIComponent(deviceToken)}` : "")
    );
}

/** Reconnect wait after `attempt` consecutive failures: 3s doubling, capped. */
export function reconnectDelay(attempt: number): number {
    return Math.min(
        BASE_RECONNECT_DELAY_MS * 2 ** attempt,
        MAX_RECONNECT_DELAY_MS,
    );
}

export type PaymentStatusPayload = {
    orderId: string;
    status: "COMPLETED" | "FAILED";
    paymentMethod: "MOBILE_READER" | "TERMINAL" | "CASH";
    paymentId?: string;
};

type WebSocketMessage =
    | { type: "connection"; payload: null }
    | { type: "order_created"; payload: { orderId: string } }
    | { type: "order_updated"; payload: { orderId: string } }
    | { type: "device_paired"; payload: { deviceId: string } }
    | { type: "payment_status"; payload: PaymentStatusPayload };

interface WebSocketState {
    isConnected: boolean;
    lastPaymentStatus: PaymentStatusPayload | null;
    setConnected: (connected: boolean) => void;
    setPaymentStatus: (status: PaymentStatusPayload | null) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
    isConnected: false,
    lastPaymentStatus: null,
    setConnected: (connected) => set({ isConnected: connected }),
    setPaymentStatus: (status) => set({ lastPaymentStatus: status }),
}));

/**
 * Connects to the backend WebSocket and keeps the store updated with
 * incoming events. Call this once at the app root.
 */
export function useWebSocketConnection() {
    const { backendUrl } = useSettingsStore();
    const { setConnected, setPaymentStatus } = useWebSocketStore();

    useEffect(() => {
        // Same origin unless an absolute backend URL is configured; the
        // socket always lives at /ws.
        const wsUrl = buildWsUrl(
            backendUrl,
            window.location.origin,
            getDeviceToken(),
        );

        let ws: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        let attempt = 0;

        const connect = () => {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                attempt = 0;
                setConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    if (message.type === "payment_status") {
                        setPaymentStatus(message.payload);
                    }
                } catch {
                    // Ignore malformed messages.
                }
            };

            ws.onclose = () => {
                if (stopped) return;
                setConnected(false);
                // Back off so a rejected upgrade is not retried in a tight loop.
                reconnectTimer = setTimeout(connect, reconnectDelay(attempt++));
            };

            ws.onerror = () => {
                ws?.close();
            };
        };

        connect();

        return () => {
            stopped = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            ws?.close();
        };
    }, [backendUrl, setConnected, setPaymentStatus]);
}
