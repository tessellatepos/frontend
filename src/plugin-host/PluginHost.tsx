import { useMemo } from "react";
import {
    PluginUIMountPoint,
    type PluginUIMountDefinition,
} from "@tessellatepos/plugin-sdk";
import { usePluginStore } from "@/stores/plugins/pluginStore.ts";
import { PluginErrorBoundary } from "./PluginErrorBoundary.tsx";
import { PluginContextProvider } from "./PluginContextProvider.tsx";

interface Props {
    mount: PluginUIMountPoint;
    /** Restrict to a single plugin (used by the PAGE mount point). */
    pluginName?: string;
}

interface ResolvedMount {
    pluginName: string;
    def: PluginUIMountDefinition;
}

/**
 * Renders all registered plugin components for a given mount point.
 * Each plugin is isolated in an error boundary and receives a
 * PluginContext scoped to its own name. Renders nothing when no
 * plugins are registered for the mount point.
 */
export function PluginHost({ mount, pluginName }: Props) {
    const { uiMounts, loaded } = usePluginStore();

    const entries = useMemo<ResolvedMount[]>(() => {
        if (!loaded) return [];
        return Object.entries(uiMounts)
            .filter(([name]) => !pluginName || name === pluginName)
            .flatMap(([name, mounts]) =>
                mounts
                    .filter((m) => m.mount === mount)
                    .map((def) => ({ pluginName: name, def })),
            );
    }, [uiMounts, loaded, mount, pluginName]);

    if (entries.length === 0) return null;

    return (
        <>
            {entries.map(({ pluginName: name, def }, index) => {
                const Component = def.component;
                return (
                    <PluginErrorBoundary
                        key={`${name}-${index}`}
                        pluginName={name}>
                        <PluginContextProvider pluginName={name}>
                            {(context) => <Component context={context} />}
                        </PluginContextProvider>
                    </PluginErrorBoundary>
                );
            })}
        </>
    );
}
