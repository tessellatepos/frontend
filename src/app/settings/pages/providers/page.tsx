import { useCallback, useEffect, useState } from "react";
import type { ProviderId } from "@tessellatepos/sdk";
import { apiFetch } from "@/utils/apiFetch.ts";
import SquareConnection from "@/app/settings/pages/providers/squareConnection.tsx";

interface IProviderState {
    active: ProviderId;
    available: ProviderId[];
    syncError?: string;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
    square: "Square",
    local: "Local (cash only, for testing)",
};

export default function Providers() {
    const [state, setState] = useState<IProviderState>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const response = await apiFetch(`/api/v1/config/provider`);
            if (!response.ok) throw new Error(`returned ${response.status}`);
            setState((await response.json()) as IProviderState);
        } catch (err) {
            console.error("Failed to read the active provider", err);
            setError("Could not read the active provider.");
        }
    }, []);

    useEffect(() => {
        const doFetch = async () => {
            await load();
        };
        void doFetch();
    }, [load]);

    async function switchProvider(provider: ProviderId) {
        setBusy(true);
        setError("");
        try {
            const response = await apiFetch(`/api/v1/config/provider`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider }),
            });
            if (!response.ok) throw new Error(`returned ${response.status}`);
            setState((await response.json()) as IProviderState);
        } catch (err) {
            console.error("Failed to switch provider", err);
            setError("Could not switch provider.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={`flex p-5 w-full h-full flex-col gap-5`}>
            <h1 className={`text-2xl`}>Providers</h1>

            <section className={`flex flex-col gap-3 max-w-2xl`}>
                <label
                    className={`font-semibold`}
                    htmlFor="provider-select">
                    Active provider
                </label>
                <select
                    id="provider-select"
                    className={`border rounded px-3 py-2`}
                    disabled={busy || !state}
                    value={state?.active ?? ""}
                    onChange={(e) =>
                        void switchProvider(e.target.value as ProviderId)
                    }>
                    {state?.available.map((id) => (
                        <option
                            key={id}
                            value={id}>
                            {PROVIDER_LABELS[id] ?? id}
                        </option>
                    ))}
                </select>
                <p className={`text-sm text-gray-500`}>
                    Switching takes effect immediately and re-syncs the catalog.
                    Existing orders are kept.
                </p>
                {state?.syncError && (
                    <p className={`text-yellow-700`}>{state.syncError}</p>
                )}
                {error && <p className={`text-red-600`}>{error}</p>}
            </section>

            {state?.active === "square" && <SquareConnection />}
        </div>
    );
}
