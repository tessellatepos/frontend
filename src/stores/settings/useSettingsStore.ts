import { create } from "zustand";
import type { DeviceType } from "@tessellatepos/sdk";

export type SettingsView =
    | "general"
    | "appearance"
    | "devices"
    | "users"
    | "sign-in"
    | "storefronts"
    | "providers";
export type DeviceView = "list" | "add" | "pair-terminal" | "add-local";

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
    /** The till's device type; empty until the till has loaded its device. */
    deviceType: DeviceType | "";
    setDeviceType: (deviceType: DeviceType | "") => void;
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
    deviceType: "",
    setDeviceType: (deviceType) => set({ deviceType }),
}));
