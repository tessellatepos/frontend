import * as React from "react";
import { type ReactNode, useEffect } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as sdk from "@tessellatepos/sdk";
import * as pluginSdk from "@tessellatepos/plugin-sdk";
import { FrontendPlugin, type PluginManifest } from "@tessellatepos/plugin-sdk";
import { exposeSharedModules } from "@tessellatepos/plugin-sdk/host";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { usePluginStore } from "@/stores/plugins/pluginStore.ts";
import { Logger } from "tslog";

const logger = new Logger();

// Plugin bundles don't ship their own React or SDKs; they use these
// instances. Must run before any plugin bundle is imported.
exposeSharedModules({
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@tessellatepos/sdk": sdk,
    "@tessellatepos/plugin-sdk": pluginSdk,
});

interface PluginClientModule {
    default: (plugin: FrontendPlugin) => void | Promise<void>;
}

interface DiscoveredPluginResponse {
    plugins: {
        name: string;
        version: string;
        clientEntryUrl: string | null;
    }[];
}

/**
 * Discovers installed plugins from the backend, dynamically imports each
 * plugin's client bundle, calls its registration function to collect UI
 * mounts, and stores the results in the plugin store. Mounted once at the
 * app root. Plugins that fail to load are logged and skipped — the POS
 * continues without them.
 */
export function PluginLoader({ children }: { children: ReactNode }) {
    const { backendUrl } = useSettingsStore();
    const { setPlugins, setUiMounts, setLoaded } = usePluginStore();

    useEffect(() => {
        async function discover() {
            try {
                const res = await fetch(
                    `${backendUrl}/api/v1/plugins-discovery`,
                );
                if (!res.ok) {
                    logger.warn("Plugin discovery failed:", res.status);
                    setLoaded(true);
                    return;
                }

                const data: DiscoveredPluginResponse = await res.json();
                setPlugins(data.plugins);

                // Import each plugin's client bundle and collect UI mounts.
                // Errors are caught per-plugin so one failure doesn't block
                // the others.
                await Promise.all(
                    data.plugins
                        .filter((p) => p.clientEntryUrl)
                        .map(async (p) => {
                            try {
                                // Use a relative URL for the import so the
                                // Vite dev proxy (or production reverse proxy)
                                // handles the request same-origin. Falling
                                // back to backendUrl ensures direct access
                                // works when no proxy is configured.
                                const importUrl = p.clientEntryUrl!.startsWith(
                                    "/",
                                )
                                    ? p.clientEntryUrl!
                                    : new URL(
                                          p.clientEntryUrl!,
                                          backendUrl || window.location.origin,
                                      ).href;

                                const module = (await import(
                                    /* @vite-ignore */ importUrl
                                )) as PluginClientModule;

                                const manifest: PluginManifest = {
                                    name: p.name,
                                    version: p.version,
                                    main: "",
                                    tessellate: { permissions: [] },
                                };

                                const frontendPlugin = new FrontendPlugin(
                                    manifest,
                                );
                                await module.default(frontendPlugin);

                                setUiMounts(p.name, frontendPlugin.get("ui"));
                            } catch (err) {
                                logger.error(
                                    `Failed to load plugin client bundle "${p.name}":`,
                                    err,
                                );
                            }
                        }),
                );

                setLoaded(true);
            } catch (err) {
                logger.error("Plugin discovery error:", err);
                setLoaded(true);
            }
        }

        void discover();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backendUrl]);

    return <>{children}</>;
}
