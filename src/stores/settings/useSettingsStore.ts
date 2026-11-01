import { create } from "zustand";

export type SettingsView =
    "general" | "appearance" | "devices" | "users" | "sign-in";
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
 * Empty means same-origin: requests use relative URLs and the host's reverse
 * proxy (nginx, Caddy, or the Vite dev proxy) routes them to the backend. Set
 * an absolute URL (e.g. for the mobile WebView) to talk to another origin.
 */
function defaultBackendUrl(): string {
    return "";
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
