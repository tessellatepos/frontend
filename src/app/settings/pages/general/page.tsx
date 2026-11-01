import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { ProviderId } from "@tessellatepos/sdk";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { apiFetch } from "@/utils/apiFetch.ts";
import { meetsRole, roleHasScope } from "@/utils/scopes.ts";
import { settingsPath } from "@/app/settings/tabs.ts";
import { PROVIDER_LABELS } from "@/app/settings/pages/providers/labels.ts";

/** Set in vite.config.ts from package.json. */
declare const __APP_VERSION__: string;

interface ILocation {
    id: string;
    name: string;
}

/**
 * Read-only overview of this installation, with links to the tabs that change
 * it. Every value comes from an endpoint the role may already read.
 */
export default function General() {
    const role = useAuthStore((s) => s.user?.role);
    const canReadProvider = roleHasScope(role, "settings:read");
    const canReadLocations = roleHasScope(role, "locations:read");

    const [provider, setProvider] = useState<ProviderId>();
    const [providerError, setProviderError] = useState(false);
    const [locations, setLocations] = useState<ILocation[]>();
    const [locationsError, setLocationsError] = useState(false);

    useEffect(() => {
        if (!canReadProvider) return;
        const doFetch = async () => {
            try {
                const response = await apiFetch(`/api/v1/config/provider`);
                if (!response.ok)
                    throw new Error(`returned ${response.status}`);
                const body = (await response.json()) as { active: ProviderId };
                setProvider(body.active);
            } catch (err) {
                console.error("Failed to read the active provider", err);
                setProviderError(true);
            }
        };
        void doFetch();
    }, [canReadProvider]);

    useEffect(() => {
        if (!canReadLocations) return;
        const doFetch = async () => {
            try {
                const response = await apiFetch(`/api/v1/locations`);
                if (!response.ok)
                    throw new Error(`returned ${response.status}`);
                setLocations((await response.json()) as ILocation[]);
            } catch (err) {
                console.error("Failed to load locations", err);
                setLocationsError(true);
            }
        };
        void doFetch();
    }, [canReadLocations]);

    return (
        <div className={`flex p-5 w-full h-full flex-col gap-5`}>
            <h1 className={`text-2xl`}>General</h1>

            {canReadProvider && (
                <section
                    aria-labelledby="general-provider"
                    className={`flex flex-col gap-2 max-w-2xl`}>
                    <h2
                        id="general-provider"
                        className={`text-lg font-semibold`}>
                        Payments
                    </h2>
                    {providerError ? (
                        <p className={`text-red-600`}>
                            Could not read the active provider.
                        </p>
                    ) : provider ? (
                        <p>
                            Active provider:{" "}
                            {PROVIDER_LABELS[provider] ?? provider}
                        </p>
                    ) : (
                        <p className={`text-sm text-gray-500`}>Loading…</p>
                    )}
                    {meetsRole(role, "owner") && (
                        <Link
                            to={settingsPath("providers")}
                            className={`text-blue-600 underline w-fit`}>
                            Manage providers
                        </Link>
                    )}
                </section>
            )}

            {canReadLocations && (
                <section
                    aria-labelledby="general-locations"
                    className={`flex flex-col gap-2 max-w-2xl`}>
                    <h2
                        id="general-locations"
                        className={`text-lg font-semibold`}>
                        Locations
                    </h2>
                    {locationsError ? (
                        <p className={`text-red-600`}>
                            Could not load locations.
                        </p>
                    ) : locations === undefined ? (
                        <p className={`text-sm text-gray-500`}>Loading…</p>
                    ) : locations.length === 0 ? (
                        <p>No locations yet.</p>
                    ) : (
                        <p>
                            {locations.length}{" "}
                            {locations.length === 1 ? "location" : "locations"}:{" "}
                            {locations.map((l) => l.name).join(", ")}
                        </p>
                    )}
                    {meetsRole(role, "manager") && (
                        <Link
                            to={settingsPath("storefronts")}
                            className={`text-blue-600 underline w-fit`}>
                            Manage storefronts
                        </Link>
                    )}
                </section>
            )}

            <section
                aria-labelledby="general-about"
                className={`flex flex-col gap-2 max-w-2xl`}>
                <h2
                    id="general-about"
                    className={`text-lg font-semibold`}>
                    About
                </h2>
                <p>Tessellate version {__APP_VERSION__}</p>
            </section>
        </div>
    );
}
