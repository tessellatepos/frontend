"use client";
import { useParams } from "react-router";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";

/**
 * Full-page route for plugins that use the PAGE mount point.
 * Renders only the plugin specified by the :pluginName route param.
 */
export default function PluginPage() {
    const { pluginName } = useParams();

    if (!pluginName) return null;

    return (
        <div className="w-full min-h-screen dark:bg-gray-900">
            <PluginHost
                mount={PluginUIMountPoint.PAGE}
                pluginName={pluginName}
            />
        </div>
    );
}
