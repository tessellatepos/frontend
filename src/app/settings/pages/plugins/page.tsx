import { useState } from "react";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
    type DiscoveredPlugin,
    type PluginLoadStatus,
    usePluginStore,
} from "@/stores/plugins/pluginStore.ts";

const STATUS_LABELS: Record<PluginLoadStatus, string> = {
    loaded: "Loaded",
    failed: "Failed to load",
    "server-only": "Server only",
};

const STATUS_STYLES: Record<PluginLoadStatus, string> = {
    loaded: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    "server-only": "bg-gray-100 text-gray-800",
};

/** Settings -> Plugins: read-only list of the plugins installed on the server. */
export default function Plugins() {
    const { plugins, loaded } = usePluginStore();

    return (
        <div className="flex w-full flex-col gap-4 p-5">
            <h1 className="text-2xl">Plugins</h1>
            <p className="max-w-2xl text-sm text-gray-600">
                Plugins installed on this server. They are added to the
                server&apos;s <code>plugins</code> folder and load when it
                starts.
            </p>
            {!loaded ? (
                <Spinner />
            ) : plugins.length === 0 ? (
                <p>No plugins installed.</p>
            ) : (
                <ul className="flex flex-col divide-y rounded border">
                    {plugins.map((plugin) => (
                        <PluginRow
                            key={plugin.name}
                            plugin={plugin}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function PluginRow({ plugin }: { plugin: DiscoveredPlugin }) {
    const [open, setOpen] = useState(false);
    const status = usePluginStore((s) => s.status[plugin.name]);
    const error = usePluginStore((s) => s.errors[plugin.name]);
    const mounts = usePluginStore((s) => s.uiMounts[plugin.name]) ?? [];
    const detailsId = `plugin-details-${plugin.name}`;

    return (
        <li className="p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-lg font-semibold">
                            {plugin.name}
                        </span>
                        <span className="text-sm text-gray-600">
                            v{plugin.version}
                        </span>
                        {status && (
                            <span
                                className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[status]}`}>
                                {STATUS_LABELS[status]}
                            </span>
                        )}
                    </div>
                    {plugin.description && (
                        <p className="text-sm">{plugin.description}</p>
                    )}
                    {plugin.author && (
                        <p className="text-sm text-gray-600">
                            by {plugin.author}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={detailsId}
                    onClick={() => setOpen((o) => !o)}
                    className="shrink-0 text-sm underline">
                    {open ? "Hide details" : "Details"}
                </button>
            </div>
            {open && (
                <dl
                    id={detailsId}
                    className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-gray-600">Permissions</dt>
                    <dd>
                        {plugin.permissions.length
                            ? plugin.permissions.join(", ")
                            : "None"}
                    </dd>
                    <dt className="text-gray-600">UI mounts</dt>
                    <dd>
                        {mounts.length
                            ? mounts.map((m) => m.mount).join(", ")
                            : "None"}
                    </dd>
                    <dt className="text-gray-600">License</dt>
                    <dd>{plugin.license ?? "Not specified"}</dd>
                    {plugin.homepage && (
                        <>
                            <dt className="text-gray-600">Homepage</dt>
                            <dd>
                                <a
                                    href={plugin.homepage}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline">
                                    {plugin.homepage}
                                </a>
                            </dd>
                        </>
                    )}
                    {error && (
                        <>
                            <dt className="text-gray-600">Error</dt>
                            <dd
                                role="alert"
                                className="text-red-600">
                                {error}
                            </dd>
                        </>
                    )}
                </dl>
            )}
        </li>
    );
}
