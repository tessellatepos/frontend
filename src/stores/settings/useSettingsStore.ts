import { create } from "zustand";

export type SettingsView = "general" | "appearance" | "devices";
export type DeviceView = "list" | "add" | "pair-terminal";

interface SettingsState {
    view: SettingsView;
    setView: (view: SettingsView) => void;
    deviceView: DeviceView;
    setDeviceView: (view: DeviceView) => void;
    locationId: string;
    setLocationId: (locationId: string) => void;
    backendUrl: string;
    setBackendURL: (backendUrl: string) => void;
    deviceId: string;
    setDeviceId: (deviceId: string) => void;
}

/**
 * Defaults the backend to wherever this page was loaded from (same host,
 * backend port) so the storefront works from a desktop browser, the Android
 * emulator's WebView (10.0.2.2), or a LAN device without per-device config.
 */
function defaultBackendUrl(): string {
    if (typeof window === "undefined") return "http://localhost:3000";
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    view: "general",
    setView: (view) => set({ view }),
    deviceView: "list",
    setDeviceView: (deviceView) => set({ deviceView }),
    locationId: "",
    setLocationId: (locationId) => set({ locationId }),
    backendUrl: defaultBackendUrl(),
    setBackendURL: (backendURL) => set({ backendUrl: backendURL }),
    deviceId: "",
    setDeviceId: (deviceId) => set({ deviceId }),
}));
