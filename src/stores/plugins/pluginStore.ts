import { create } from "zustand";
import type { PluginUIMountDefinition } from "@tessellatepos/plugin-sdk";

export interface DiscoveredPlugin {
    name: string;
    version: string;
    clientEntryUrl: string | null;
}

interface PluginStoreState {
    /** Plugins discovered from the backend discovery endpoint. */
    plugins: DiscoveredPlugin[];
    /** True once discovery + client-bundle import has completed. */
    loaded: boolean;
    /** Map of pluginName → UI mount definitions resolved from client bundles. */
    uiMounts: Record<string, PluginUIMountDefinition[]>;
    setPlugins: (plugins: DiscoveredPlugin[]) => void;
    setUiMounts: (
        pluginName: string,
        mounts: PluginUIMountDefinition[],
    ) => void;
    setLoaded: (loaded: boolean) => void;
}

export const usePluginStore = create<PluginStoreState>((set) => ({
    plugins: [],
    loaded: false,
    uiMounts: {},
    setPlugins: (plugins) => set({ plugins }),
    setUiMounts: (pluginName, mounts) =>
        set((state) => ({
            uiMounts: { ...state.uiMounts, [pluginName]: mounts },
        })),
    setLoaded: (loaded) => set({ loaded }),
}));
