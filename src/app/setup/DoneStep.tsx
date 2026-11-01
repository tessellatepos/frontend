import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { StepError, StepHeading } from "./StepHeading.tsx";
import { commonError, postSetup } from "./api.ts";

/** Step 4: finish setup. */
export function DoneStep() {
    const refresh = useAuthStore((s) => s.refresh);
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function complete() {
        setBusy(true);
        setError("");
        const result = await postSetup("complete");
        if (result.ok || result.data.code === "SETUP_COMPLETE") {
            await refresh();
            void navigate("/", { replace: true });
            return;
        }
        if (result.status === 409) {
            await refresh();
            const missing = result.data.missing?.join(", ");
            setError(
                `Setup is not finished yet${missing ? `: still missing ${missing}` : ""}.`,
            );
        } else {
            setError(commonError(result));
        }
        setBusy(false);
    }

    return (
        <div className="flex flex-col gap-4">
            <StepHeading>All set</StepHeading>
            <p>
                Your store is ready. Next, open Settings and pair your first
                device to start taking orders at a till.
            </p>
            {error && <StepError>{error}</StepError>}
            <button
                type="button"
                disabled={busy}
                onClick={() => void complete()}
                className="self-start rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                {busy ? "Finishing…" : "Finish setup"}
            </button>
        </div>
    );
}
