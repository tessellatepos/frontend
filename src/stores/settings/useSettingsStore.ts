import { create } from "zustand";

export type SettingsView = "general" | "appearance" | "devices";
export type DeviceView = "list" | "add";

interface SettingsState {
    view: SettingsView;
    setView: (view: SettingsView) => void;
    deviceView: DeviceView;
    setDeviceView: (view: DeviceView) => void;
    locationId: string;
    setLocationId: (locationId: string) => void;
    backendUrl: string;
    setBackendURL: (backendUrl: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    view: "general",
    setView: (view) => set({ view }),
    deviceView: "list",
    setDeviceView: (deviceView) => set({ deviceView }),
    locationId: "",
    setLocationId: (locationId) => set({ locationId }),
    backendUrl: "http://localhost:3000",
    setBackendURL: (backendURL) => set({ backendUrl: backendURL }),
}));
