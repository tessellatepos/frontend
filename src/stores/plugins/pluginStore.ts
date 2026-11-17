import { create } from "zustand";
import type { PluginUIMountDefinition } from "@tessellatepos/plugin-sdk";

export interface DiscoveredPlugin {
    name: string;
    version: string;
    clientEntryUrl: string | null;
    description: string | null;
    author: string | null;
    license: string | null;
    homepage: string | null;
    permissions: string[];
}

/** Whether a plugin's client bundle is running in this browser. */
export type PluginLoadStatus = "loaded" | "failed" | "server-only";

interface PluginStoreState {
    /** Plugins discovered from the backend discovery endpoint. */
    plugins: DiscoveredPlugin[];
    /** True once discovery + client-bundle import has completed. */
    loaded: boolean;
    /** Map of pluginName → UI mount definitions resolved from client bundles. */
    uiMounts: Record<string, PluginUIMountDefinition[]>;
    /** Per-plugin client load result, keyed by plugin name. */
    status: Record<string, PluginLoadStatus>;
    /** Error message for plugins whose status is "failed". */
    errors: Record<string, string>;
    setPlugins: (plugins: DiscoveredPlugin[]) => void;
    setStatus: (
        pluginName: string,
        status: PluginLoadStatus,
        error?: string,
    ) => void;
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
    status: {},
    errors: {},
    setPlugins: (plugins) => set({ plugins }),
    setStatus: (pluginName, status, error) =>
        set((state) => ({
            status: { ...state.status, [pluginName]: status },
            errors: error
                ? { ...state.errors, [pluginName]: error }
                : state.errors,
        })),
    setUiMounts: (pluginName, mounts) =>
        set((state) => ({
            uiMounts: { ...state.uiMounts, [pluginName]: mounts },
        })),
    setLoaded: (loaded) => set({ loaded }),
}));
