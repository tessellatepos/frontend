import { create } from "zustand";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

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
        const base = new URL(backendUrl || window.location.origin);
        base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
        base.pathname = "/ws";
        const wsUrl = base.href;

        let ws: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;

        const connect = () => {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
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
                // Reconnect after a short delay.
                reconnectTimer = setTimeout(connect, 3000);
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
