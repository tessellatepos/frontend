import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Location } from "@tessellatepos/sdk";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

interface ISquareAuthStatus {
    authorized: boolean;
    locationId: string | null;
    merchantId: string | null;
    tokenExpiresAt: string | null;
}

export default function SettingsHome() {
    const { backendUrl } = useSettingsStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState<ISquareAuthStatus>();
    const [locationName, setLocationName] = useState<string>();
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [busy, setBusy] = useState(false);

    // The backend's OAuth callback redirects back here with the outcome.
    const callbackOutcome = searchParams.get("square_auth");

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(
                `${backendUrl}/api/v1/square/oauth/status`,
            );
            if (!response.ok) {
                throw new Error(`status endpoint returned ${response.status}`);
            }
            const authStatus = (await response.json()) as ISquareAuthStatus;
            setStatus(authStatus);

            if (authStatus.locationId) {
                const locationResponse = await fetch(
                    `${backendUrl}/api/v1/locations/${authStatus.locationId}`,
                );
                if (locationResponse.ok) {
                    setLocationName(
                        ((await locationResponse.json()) as Location).name,
                    );
                }
            }
        } catch (err) {
            console.error("Failed to read Square connection status", err);
            setErrorMessage("Could not read the Square connection status.");
        }
    }, [backendUrl]);

    useEffect(() => {
        const doFetch = async () => {
            await fetchStatus();
        };
        void doFetch();
    }, [fetchStatus]);

    /** Drops the callback outcome from the URL so it doesn't outlive the visit. */
    function clearCallbackOutcome() {
        if (!callbackOutcome) return;
        const params = new URLSearchParams(searchParams);
        params.delete("square_auth");
        setSearchParams(params, { replace: true });
    }

    async function connectSquare() {
        setBusy(true);
        setErrorMessage("");
        clearCallbackOutcome();
        try {
            const response = await fetch(
                `${backendUrl}/api/v1/square/oauth/authorize`,
            );
            if (!response.ok) {
                throw new Error(`authorize returned ${response.status}`);
            }
            const { url }: { url: string } = await response.json();
            window.location.assign(url);
        } catch (err) {
            console.error("Failed to start Square authorization", err);
            setErrorMessage(
                "Could not start Square authorization — check the backend's Square application settings.",
            );
            setBusy(false);
        }
    }

    async function disconnectSquare() {
        setBusy(true);
        setErrorMessage("");
        setMessage("");
        clearCallbackOutcome();
        try {
            const response = await fetch(
                `${backendUrl}/api/v1/square/oauth/revoke`,
                { method: "POST" },
            );
            if (!response.ok) {
                throw new Error(`revoke returned ${response.status}`);
            }
            setMessage("Square disconnected.");
            await fetchStatus();
        } catch (err) {
            console.error("Failed to revoke Square authorization", err);
            setErrorMessage("Could not disconnect Square.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={`flex p-5 w-full h-full flex-col gap-5`}>
            <h1 className={`text-2xl`}>General Settings</h1>

            <section className={`flex flex-col gap-3 max-w-2xl`}>
                <h2 className={`text-xl`}>Square Connection</h2>

                <div className={`flex items-center gap-2`}>
                    <span
                        className={`inline-block w-3 h-3 rounded-full ${
                            status?.authorized ? "bg-green-500" : "bg-gray-400"
                        }`}
                    />
                    <span>
                        {status === undefined
                            ? "Checking…"
                            : status.authorized
                              ? "Connected"
                              : "Not connected"}
                    </span>
                </div>

                {status?.authorized && (
                    <dl className={`grid grid-cols-[auto_1fr] gap-x-4`}>
                        <dt className={`font-semibold`}>Merchant</dt>
                        <dd>{status.merchantId ?? "—"}</dd>
                        <dt className={`font-semibold`}>Location</dt>
                        <dd>{locationName ?? status.locationId ?? "—"}</dd>
                        <dt className={`font-semibold`}>Token renews before</dt>
                        <dd>
                            {status.tokenExpiresAt
                                ? new Date(
                                      status.tokenExpiresAt,
                                  ).toLocaleString()
                                : "—"}
                        </dd>
                    </dl>
                )}

                <p className={`text-sm text-gray-500`}>
                    Connecting sends you to Square to grant this deployment
                    access. Tokens are stored encrypted on the backend — card
                    readers request a short-lived token per payment and never
                    hold Square credentials.
                </p>

                <div className={`flex gap-3`}>
                    {status?.authorized ? (
                        <button
                            className={`bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50`}
                            disabled={busy}
                            onClick={() => void disconnectSquare()}>
                            Disconnect
                        </button>
                    ) : (
                        <button
                            className={`bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50`}
                            disabled={busy}
                            onClick={() => void connectSquare()}>
                            Connect Square
                        </button>
                    )}
                </div>

                {(message || callbackOutcome === "success") && (
                    <p className={`text-green-600`}>
                        {message || "Square connected."}
                    </p>
                )}
                {(errorMessage || callbackOutcome === "error") && (
                    <p className={`text-red-600`}>
                        {errorMessage ||
                            "Square authorization failed or was denied. Try connecting again."}
                    </p>
                )}
            </section>
        </div>
    );
}
