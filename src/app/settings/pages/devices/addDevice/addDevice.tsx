import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { useEffect, useState } from "react";
import type { IConfigDevice } from "@tessellatepos/common/src/types/database.ts";

export default function AddDevice() {
    const { setDeviceView, backendUrl } = useSettingsStore();
    const [deviceConfig, setDeviceConfig] = useState<IConfigDevice>();

    async function cancelPairing(deviceID: string) {
        await fetch(
            `${backendUrl}/api/v1/config/devices/pair-device/${deviceID}`,
            {
                method: "DELETE",
            },
        );
        setDeviceView("list");
    }

    async function fetchDeviceConfigs() {
        const response = await fetch(
            `${backendUrl}/api/v1/config/devices/pair-device/`,
        );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch device configurations from backend",
            );
        }

        const deviceConfig: IConfigDevice = await response.json();

        if (deviceConfig) {
            setDeviceConfig(deviceConfig);
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
    return (
        <div>
            <div className={`flex flex-col`}>
                <button
                    className={`bg-red-500 text-white px-4 py-2 rounded`}
                    onClick={() => cancelPairing(deviceConfig!.id)}>
                    Cancel Pairing
                </button>
            </div>
            <div>
                <h1>{deviceConfig?.id}</h1>
                <h1>{deviceConfig?.paring_code}</h1>
            </div>
        </div>
    );
}
