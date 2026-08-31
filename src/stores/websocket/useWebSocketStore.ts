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
        // Derive the WebSocket URL from the backend HTTP URL.
        const wsUrl = backendUrl.replace(/^http/, "ws");

        let ws: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

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
            if (reconnectTimer) clearTimeout(reconnectTimer);
            ws?.close();
        };
    }, [backendUrl, setConnected, setPaymentStatus]);
}
