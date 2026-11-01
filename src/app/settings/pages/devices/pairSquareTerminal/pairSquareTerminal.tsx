import { apiFetch } from "@/utils/apiFetch.ts";
import { buttonVariants } from "@/components/ui/button.tsx";
import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import type { IConfigDevice, Location } from "@tessellatepos/sdk";

type PairingStatus = "UNKNOWN" | "UNPAIRED" | "PAIRED" | "EXPIRED";

// Pairs a physical Square Terminal to this merchant account via Square's own
// Device Code flow: Square generates a short code, the operator enters it on
// the terminal's screen, and Square then reports that code as PAIRED along
// with the terminal's real device_id — the id order checkouts need.
export default function PairSquareTerminal() {
    const { setDeviceView } = useSettingsStore();
    const [locations, setLocations] = useState<Location[]>([]);
    const [locationId, setLocationId] = useState("");
    const [name, setName] = useState("");
    const [device, setDevice] = useState<IConfigDevice>();
    const [code, setCode] = useState<string>();
    const [status, setStatus] = useState<PairingStatus>();
    const [error, setError] = useState<string>();
    const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(
        undefined,
    );

    useEffect(() => {
        async function fetchLocations() {
            try {
                const response = await apiFetch(`/api/v1/square/locations`);
                if (!response.ok) return;
                setLocations((await response.json()) as Location[]);
            } catch (err) {
                console.error("Failed to fetch Square locations", err);
            }
        }
        void fetchLocations();
    }, []);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    async function cancel() {
        if (device) {
            await apiFetch(`/api/v1/config/devices/pair-device/${device.id}`, {
                method: "DELETE",
            });
        }
        setDeviceView("list");
    }

    async function generateCode() {
        if (!locationId) {
            setError("Select a Square location first");
            return;
        }
        setError(undefined);

        try {
            const createResponse = await apiFetch(
                `/api/v1/config/devices/pair-device/`,
            );
            if (!createResponse.ok) {
                throw new Error("Failed to create device configuration");
            }
            const newDevice: IConfigDevice = await createResponse.json();
            setDevice(newDevice);

            const pairingResponse = await apiFetch(
                `/api/v1/config/devices/${newDevice.id}/square-pairing`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        locationId,
                        name: name || undefined,
                    }),
                },
            );
            if (!pairingResponse.ok) {
                throw new Error("Failed to generate a Square pairing code");
            }
            const pairing: { code: string; pairBy?: string } =
                await pairingResponse.json();
            setCode(pairing.code);
            setStatus("UNPAIRED");

            pollRef.current = setInterval(async () => {
                try {
                    const statusResponse = await apiFetch(
                        `/api/v1/config/devices/${newDevice.id}/square-pairing`,
                    );
                    if (!statusResponse.ok) return;
                    const { status: pairingStatus }: { status: PairingStatus } =
                        await statusResponse.json();
                    setStatus(pairingStatus);
                    if (pairingStatus === "PAIRED") {
                        clearInterval(pollRef.current);
                        setDeviceView("list");
                    } else if (pairingStatus === "EXPIRED") {
                        clearInterval(pollRef.current);
                    }
                } catch {
                    // transient network error — try again next tick
                }
            }, 2000);
        } catch (err) {
            console.error("Failed to start Square terminal pairing", err);
            setError(
                err instanceof Error ? err.message : "Failed to start pairing",
            );
        }
    }

    return (
        <div className={`flex flex-col gap-4 max-w-md`}>
            <h2 className={`text-xl font-bold`}>Pair Square Terminal</h2>

            {!code && (
                <>
                    <label className={`flex flex-col gap-1`}>
                        Square location
                        <select
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}>
                            <option value="">Select a location</option>
                            {locations.map((location) => (
                                <option
                                    key={location.id}
                                    value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={`flex flex-col gap-1`}>
                        Terminal name (optional)
                        <input
                            type="text"
                            placeholder="Counter 1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    {error && <p className={`text-red-600`}>{error}</p>}
                    <div className={`flex gap-2`}>
                        <button
                            className={buttonVariants()}
                            onClick={() => void generateCode()}>
                            Generate pairing code
                        </button>
                        <button
                            className={buttonVariants({
                                variant: "destructive",
                            })}
                            onClick={() => void cancel()}>
                            Cancel
                        </button>
                    </div>
                </>
            )}

            {code && (
                <>
                    <p>Enter this code on the Terminal:</p>
                    <p
                        className={`text-4xl font-mono font-bold tracking-widest`}>
                        {code}
                    </p>
                    <p>
                        {status === "EXPIRED"
                            ? "This code has expired."
                            : "Waiting for the terminal to be paired..."}
                    </p>
                    <div className={`flex gap-2`}>
                        {status === "EXPIRED" && (
                            <button
                                className={buttonVariants()}
                                onClick={() => {
                                    setCode(undefined);
                                    setStatus(undefined);
                                }}>
                                Try again
                            </button>
                        )}
                        <button
                            className={buttonVariants({
                                variant: "destructive",
                            })}
                            onClick={() => void cancel()}>
                            Cancel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
