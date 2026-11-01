import { useMemo } from "react";
import type {
    PluginUIMountDefinition,
    PluginUIMountPoint,
} from "@tessellatepos/plugin-sdk";
import { usePluginStore } from "@/stores/plugins/pluginStore.ts";

export interface ResolvedMount {
    /** Stable per plugin + registration order; safe to use in a view id. */
    key: string;
    pluginName: string;
    def: PluginUIMountDefinition;
}

/** Every loaded plugin registration for a mount point. */
export function usePluginMounts(
    mount: PluginUIMountPoint,
    pluginName?: string,
): ResolvedMount[] {
    const { uiMounts, loaded } = usePluginStore();

    return useMemo(() => {
        if (!loaded) return [];
        return Object.entries(uiMounts)
            .filter(([name]) => !pluginName || name === pluginName)
            .flatMap(([name, defs]) =>
                defs
                    .map((def, index) => ({
                        key: `${name}:${index}`,
                        pluginName: name,
                        def,
                    }))
                    .filter(({ def }) => def.mount === mount),
            );
    }, [uiMounts, loaded, mount, pluginName]);
}
