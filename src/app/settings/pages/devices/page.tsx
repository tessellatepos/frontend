import type { IConfigDevice } from "@tessellatepos/common/src/types/database";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import AddDevice from "@/app/settings/pages/devices/addDevice/addDevice.tsx";

export default function Devices() {
    // configDotenv();
    const { deviceView, setDeviceView, backendUrl } = useSettingsStore();
    const [deviceConfigs, setDeviceConfigs] = useState<IConfigDevice[]>([]);

    async function fetchDeviceConfigs() {
        const response = await fetch(`${backendUrl}/api/v1/config/devices`);

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

    useEffect(() => {
        const doFetch = async () => {
            await fetchDeviceConfigs();
        };
        void doFetch();
    }, []);

    if (deviceView == "list" || deviceView == undefined) {
        return (
            <div className={`flex p-5 w-full h-full flex-col`}>
                {/* header */}
                <div>
                    <button
                        className={`bg-blue-500 text-white px-4 py-2 rounded`}
                        onClick={() => setDeviceView("add")}>
                        Pair new device
                    </button>
                </div>
                {/* device list */}
                <div
                    className={`flex-1 p-5 w-full flex-col rounded-2xl bg-gray-400 m-5`}>
                    <table className={`w-full border-spacing-2`}>
                        <tr className={`text-left border-b-2 border-gray-300`}>
                            <th>Device ID</th>
                            <th>Device Created</th>
                            <th>Device Pairing Code</th>
                            <th>Device Pairing Started At</th>
                            <th>Device Paired at</th>
                            <th>Square Location</th>
                            <th>Customer Facing</th>
                            <th>Device Hardware ID</th>
                        </tr>
                        <tbody className={`w-full`}>
                            {deviceConfigs.map((config) => (
                                <tr
                                    className={``}
                                    key={config.id}>
                                    <td className={`py-2`}>{config.id}</td>
                                    <td>
                                        {new Date(
                                            config.created_at,
                                        ).toLocaleString()}
                                    </td>
                                    <td>{config.paring_code}</td>
                                    <td>
                                        {new Date(
                                            config.code_created_at,
                                        ).toLocaleString()}
                                    </td>
                                    <td>
                                        {config.paired_at
                                            ? new Date(
                                                  config.paired_at,
                                              ).toLocaleString()
                                            : "Not paired yet"}
                                    </td>
                                    <td>{config.square_location}</td>
                                    <td>
                                        {config.customer_facing ? "Yes" : "No"}
                                    </td>
                                    <td>{config.device_hardware_id}</td>
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
}
