import type { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { PluginErrorBoundary } from "./PluginErrorBoundary.tsx";
import { PluginContextProvider } from "./PluginContextProvider.tsx";
import { usePluginMounts } from "./usePluginMounts.ts";

interface Props {
    mount: PluginUIMountPoint;
    /** Restrict to a single plugin (used by the PAGE mount point). */
    pluginName?: string;
    /** Restrict to one registration, by `ResolvedMount.key`. */
    entryKey?: string;
}

/**
 * Renders all registered plugin components for a given mount point.
 * Each plugin is isolated in an error boundary and receives a
 * PluginContext scoped to its own name. Renders nothing when no
 * plugins are registered for the mount point.
 */
export function PluginHost({ mount, pluginName, entryKey }: Props) {
    const entries = usePluginMounts(mount, pluginName).filter(
        (entry) => !entryKey || entry.key === entryKey,
    );

    if (entries.length === 0) return null;

    return (
        <>
            {entries.map(({ key, pluginName: name, def }) => {
                const Component = def.component;
                return (
                    <PluginErrorBoundary
                        key={key}
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
