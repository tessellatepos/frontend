import { create } from "zustand";

export type SettingsView = "general" | "appearance" | "devices";
export type DeviceView = "list" | "add";

interface SettingsState {
    view: SettingsView;
    setView: (view: SettingsView) => void;
    deviceView: DeviceView;
    setDeviceView: (view: DeviceView) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    view: "general",
    setView: (view) => set({ view }),
    deviceView: "list",
    setDeviceView: (deviceView) => set({ deviceView }),
}));
