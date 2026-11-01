import { apiFetch } from "@/utils/apiFetch.ts";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { useEffect, useState } from "react";
import type { IConfigDevice, Location } from "@tessellatepos/sdk";

/**
 * Creates a LOCAL till for a location: a cash-only till that runs in a staff
 * browser and needs no pairing code or hardware.
 */
export default function AddLocalDevice() {
    const { setDeviceView } = useSettingsStore();
    const [locations, setLocations] = useState<Location[]>([]);
    const [locationId, setLocationId] = useState("");
    const [till, setTill] = useState<IConfigDevice | null>(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const doFetch = async () => {
            try {
                const response = await apiFetch(`/api/v1/locations`);
                if (!response.ok) {
                    throw new Error(`returned ${response.status}`);
                }
                setLocations((await response.json()) as Location[]);
            } catch (err) {
                console.error("Failed to load locations", err);
                setError("Could not load locations.");
            }
        };
        void doFetch();
    }, []);

    async function createTill() {
        setError("");
        setSubmitting(true);
        try {
            const response = await apiFetch(`/api/v1/config/devices/local`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locationId }),
            });
            if (!response.ok) {
                const body = (await response.json().catch(() => ({}))) as {
                    message?: string;
                };
                setError(body.message ?? "Could not create the till.");
                return;
            }
            // 201 when new, 200 when this location already had one.
            setTill((await response.json()) as IConfigDevice);
        } catch (err) {
            console.error("Failed to create local till", err);
            setError("Could not create the till.");
        } finally {
            setSubmitting(false);
        }
    }

    if (till) {
        const location = locations.find((l) => l.id === locationId);
        return (
            <div className={`flex flex-col gap-3 w-full max-w-xl`}>
                <h1 className={`text-xl`}>
                    Local till{location ? ` for ${location.name}` : ""}
                </h1>
                <a
                    className={`text-blue-600 underline`}
                    href={`/storefront/${till.id}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    Open till
                </a>
                <p className={`text-sm text-gray-500`}>Device ID: {till.id}</p>
                <button
                    className={`bg-blue-500 text-white px-4 py-2 rounded w-fit`}
                    onClick={() => setDeviceView("list")}>
                    Back to devices
                </button>
            </div>
        );
    }

    return (
        <form
            className={`flex flex-col gap-3 w-full max-w-xl`}
            onSubmit={(e) => {
                e.preventDefault();
                void createTill();
            }}>
            <h1 className={`text-xl`}>Add local till</h1>
            <p className={`text-sm text-gray-500`}>
                A local till runs in a staff browser and takes cash only. It
                needs no pairing code or card reader.
            </p>
            <label className={`flex flex-col text-sm`}>
                Location
                <select
                    className={`border rounded px-3 py-2`}
                    required
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}>
                    <option
                        value=""
                        disabled>
                        Choose a location
                    </option>
                    {locations.map((location) => (
                        <option
                            key={location.id}
                            value={location.id}>
                            {location.name}
                        </option>
                    ))}
                </select>
            </label>
            {error && <p className={`text-red-600`}>{error}</p>}
            <div className={`flex gap-2`}>
                <button
                    className={`bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50`}
                    disabled={!locationId || submitting}
                    type="submit">
                    Create till
                </button>
                <button
                    className={`px-4 py-2 rounded border`}
                    onClick={() => setDeviceView("list")}
                    type="button">
                    Cancel
                </button>
            </div>
        </form>
    );
}
