import { apiFetch } from "@/utils/apiFetch.ts";
import type { IConfigDevice, Location } from "@tessellatepos/sdk";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import AddDevice from "@/app/settings/pages/devices/addDevice/addDevice.tsx";
import PairSquareTerminal from "@/app/settings/pages/devices/pairSquareTerminal/pairSquareTerminal.tsx";
import AddLocalDevice from "@/app/settings/pages/devices/addLocalDevice/addLocalDevice.tsx";

export default function Devices() {
    // configDotenv();
    const { deviceView, setDeviceView } = useSettingsStore();
    const isOwner = useAuthStore((s) => s.user?.role === "owner");
    const [deviceConfigs, setDeviceConfigs] = useState<IConfigDevice[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [error, setError] = useState<string | null>(null);

    async function fetchDeviceConfigs() {
        const response = await apiFetch(`/api/v1/config/devices`);

        if (!response.ok) {
            throw new Error(
                "Failed to fetch device configurations from backend",
            );
        }

        const deviceConfigs: IConfigDevice[] = await response.json();

        if (deviceConfigs) {
            setDeviceConfigs(deviceConfigs);
        } else {
            throw new Error(
                "No device configurations found in backend response",
            );
        }
    }

    /**
     * Lists the locations a device can be pinned to. The backend persists
     * them from whichever provider is active, so this works without Square.
     */
    async function fetchLocations() {
        try {
            const response = await apiFetch(`/api/v1/locations`);
            if (response.ok) {
                setLocations((await response.json()) as Location[]);
            }
        } catch (err) {
            console.error("Failed to fetch locations", err);
        }
    }

    /** Saves the device's pinned location; empty means deployment default. */
    async function setDeviceLocation(
        device: IConfigDevice,
        locationId: string,
    ) {
        try {
            const response = await apiFetch(
                `/api/v1/config/devices/${device.id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...device,
                        square_location: locationId || null,
                    }),
                },
            );
            if (!response.ok) {
                throw new Error(`update returned ${response.status}`);
            }
            await fetchDeviceConfigs();
        } catch (err) {
            console.error("Failed to set device location", err);
            alert("Failed to set the device location");
        }
    }

    useEffect(() => {
        const doFetch = async () => {
            setError(null);
            try {
                await Promise.all([fetchDeviceConfigs(), fetchLocations()]);
            } catch (err) {
                console.error("Devices page fetch error", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load device configurations",
                );
            }
        };
        void doFetch();
        // Refetch when returning to the list, so a device made in another
        // view shows up.
    }, [deviceView]);

    if (deviceView == "list" || deviceView == undefined) {
        return (
            <div className={`flex p-5 w-full h-full flex-col`}>
                {/* header */}
                <div className={`flex gap-2`}>
                    <button
                        className={`bg-blue-500 text-white px-4 py-2 rounded`}
                        onClick={() => setDeviceView("add")}>
                        Pair new device
                    </button>
                    <button
                        className={`bg-blue-500 text-white px-4 py-2 rounded`}
                        onClick={() => setDeviceView("pair-terminal")}>
                        Pair Square Terminal
                    </button>
                    {isOwner && (
                        <button
                            className={`bg-blue-500 text-white px-4 py-2 rounded`}
                            onClick={() => setDeviceView("add-local")}>
                            Add local till
                        </button>
                    )}
                </div>
                {/* error banner */}
                {error && (
                    <div className={`mt-4 p-3 rounded bg-red-100 text-red-700`}>
                        {error}
                    </div>
                )}
                {/* device list */}
                <div
                    className={`flex-1 p-5 w-full flex-col rounded-2xl bg-gray-400 m-5`}>
                    <table className={`w-full border-spacing-2`}>
                        <thead>
                            <tr
                                className={`text-left border-b-2 border-gray-300`}>
                                <th>Device ID</th>
                                <th>Device Created</th>
                                <th>Device Pairing Code</th>
                                <th>Device Pairing Started At</th>
                                <th>Device Paired at</th>
                                <th>Square Location</th>
                                <th>Customer Facing</th>
                                <th>Device Hardware ID</th>
                                <th>Square Device ID</th>
                            </tr>
                        </thead>
                        <tbody className={`w-full`}>
                            {deviceConfigs.map((config) => (
                                <tr
                                    className={``}
                                    key={config.id}>
                                    <td className={`py-2`}>
                                        {config.id}
                                        {config.device_type === "LOCAL" && (
                                            <span
                                                className={`ml-2 text-xs bg-green-600 text-white rounded px-2 py-0.5`}>
                                                Local
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {new Date(
                                            config.created_at,
                                        ).toLocaleString()}
                                    </td>
                                    {/* A LOCAL till has no pairing code. */}
                                    <td>
                                        {config.device_type === "LOCAL"
                                            ? "None (local till)"
                                            : config.pairing_code}
                                    </td>
                                    <td>
                                        {config.code_created_at
                                            ? new Date(
                                                  config.code_created_at,
                                              ).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td>
                                        {config.paired_at
                                            ? new Date(
                                                  config.paired_at,
                                              ).toLocaleString()
                                            : "Not paired yet"}
                                    </td>
                                    <td>
                                        <select
                                            value={config.square_location ?? ""}
                                            onChange={(e) =>
                                                void setDeviceLocation(
                                                    config,
                                                    e.target.value,
                                                )
                                            }>
                                            <option value="">
                                                Use deployment default
                                            </option>
                                            {locations.map((location) => (
                                                <option
                                                    key={location.id}
                                                    value={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        {config.customer_facing ? "Yes" : "No"}
                                    </td>
                                    <td>{config.device_hardware_id}</td>
                                    <td>
                                        {config.device_type === "LOCAL"
                                            ? "Not applicable"
                                            : (config.square_device_id ??
                                              (config.square_device_code_id
                                                  ? "Pairing..."
                                                  : "Not paired"))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (deviceView == "add") {
        return (
            <div className={`flex p-5 w-full`}>
                <AddDevice />
            </div>
        );
    }

    if (deviceView == "pair-terminal") {
        return (
            <div className={`flex p-5 w-full`}>
                <PairSquareTerminal />
            </div>
        );
    }

    if (deviceView == "add-local") {
        return (
            <div className={`flex p-5 w-full`}>
                <AddLocalDevice />
            </div>
        );
    }
}
