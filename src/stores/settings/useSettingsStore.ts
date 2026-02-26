import { create } from "zustand";

export type SettingsView = "general" | "appearance" | "devices";

interface SettingsState {
	view: SettingsView;
	setView: (view: SettingsView) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
	view: "general",
	setView: (view) => set({ view }),
}));
