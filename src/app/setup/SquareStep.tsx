import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { apiFetch } from "@/utils/apiFetch.ts";
import { StepError, StepHeading } from "./StepHeading.tsx";

/** Step 3 (provider "square"): connect Square through the existing OAuth flow. */
export function SquareStep() {
    const connected = useAuthStore((s) => s.setup?.squareConnected ?? false);
    const refresh = useAuthStore((s) => s.refresh);
    const [params] = useSearchParams();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // The backend's OAuth callback redirects back to /setup with the outcome.
    const outcome = params.get("square_auth");
    const failed = outcome === "error";

    useEffect(() => {
        if (outcome === "success") void refresh();
    }, [outcome, refresh]);

    async function connect() {
        setBusy(true);
        setError("");
        try {
            const response = await apiFetch(
                "/api/v1/square/oauth/authorize?returnTo=%2Fsetup",
            );
            if (!response.ok) throw new Error(`status ${response.status}`);
            const { url }: { url: string } = await response.json();
            window.location.assign(url);
        } catch (err) {
            console.error("Failed to start Square authorization", err);
            setError(
                "Could not start Square authorization. Check the backend's Square application settings.",
            );
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <StepHeading>Connect Square</StepHeading>
            <p>
                Connecting sends you to Square to grant this deployment access.
                Your store and location come from your Square account.
            </p>
            <p aria-live="polite">
                Status:{" "}
                <strong>{connected ? "Connected" : "Not connected"}</strong>
            </p>
            {outcome === "success" && connected && (
                <p role="status">Square connected.</p>
            )}
            {failed && !connected && (
                <StepError>
                    Square authorization failed or was denied. Try again.
                </StepError>
            )}
            {error && <StepError>{error}</StepError>}
            <div className="flex gap-3">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void connect()}
                    className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                    Connect Square
                </button>
                <button
                    type="button"
                    onClick={() => void refresh()}
                    className="rounded border px-4 py-2">
                    Check again
                </button>
            </div>
        </div>
    );
}
