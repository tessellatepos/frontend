import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { WelcomeStep } from "./WelcomeStep.tsx";
import { OwnerStep } from "./OwnerStep.tsx";
import { StoreStep } from "./StoreStep.tsx";
import { SquareStep } from "./SquareStep.tsx";
import { DoneStep } from "./DoneStep.tsx";
import { commonError, postSetup } from "./api.ts";

const STEPS = ["Welcome", "Owner", "Store", "Done"];

/**
 * First-run wizard. The step shown is derived from /setup/status; the only
 * browser-side state is the typed token and whether step 1 was passed.
 */
export default function Setup() {
    const status = useAuthStore((s) => s.status);
    const setupNeeded = useAuthStore((s) => s.setupNeeded);
    const setup = useAuthStore((s) => s.setup);
    const [token, setToken] = useState("");
    const [passedWelcome, setPassedWelcome] = useState(false);
    const [tokenError, setTokenError] = useState("");
    const [checking, setChecking] = useState(false);
    const refresh = useAuthStore((s) => s.refresh);
    const navigate = useNavigate();

    /** Pre-checks the setup token so a typo is caught on the welcome step. */
    async function verifyToken() {
        setTokenError("");
        if (!setup?.setupTokenRequired) {
            setPassedWelcome(true);
            return;
        }
        setChecking(true);
        const result = await postSetup("verify-token", { setupToken: token });
        setChecking(false);
        if (result.status === 204) {
            setPassedWelcome(true);
        } else if (result.status === 403) {
            setTokenError(
                "That setup token is not correct. Check the server log.",
            );
        } else if (result.status === 409) {
            // SETUP_COMPLETE / USER_EXISTS: someone already set this up.
            await refresh();
            void navigate("/", { replace: true });
        } else {
            setTokenError(commonError(result));
        }
    }

    if (status === "unknown" || setupNeeded === null || !setup) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }
    if (!setupNeeded)
        return (
            <Navigate
                to="/"
                replace
            />
        );
    // Owner exists: resuming needs their session.
    if (setup.steps.owner && status === "signed-out")
        return (
            <Navigate
                to="/login?returnTo=%2Fsetup"
                replace
            />
        );

    const storeDone =
        setup.provider === "square" ? setup.squareConnected : setup.steps.store;
    let step: number;
    if (!setup.steps.owner) step = passedWelcome ? 1 : 0;
    else step = storeDone ? 3 : 2;

    return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-5">
            <ol
                className="flex gap-2 text-sm"
                aria-label="Setup progress">
                {STEPS.map((label, i) => (
                    <li
                        key={label}
                        aria-current={i === step ? "step" : undefined}
                        className={
                            i === step
                                ? "font-bold"
                                : i < step
                                  ? "text-green-700"
                                  : "text-gray-500"
                        }>
                        {i + 1}. {label}
                        {i < step ? " (done)" : ""}
                    </li>
                ))}
            </ol>
            {step === 0 && (
                <WelcomeStep
                    tokenRequired={setup.setupTokenRequired}
                    token={token}
                    onToken={setToken}
                    error={tokenError}
                    busy={checking}
                    onContinue={() => void verifyToken()}
                />
            )}
            {step === 1 && (
                <OwnerStep
                    token={token}
                    onBadToken={(message) => {
                        setTokenError(message);
                        setPassedWelcome(false);
                    }}
                />
            )}
            {step === 2 &&
                (setup.provider === "square" ? <SquareStep /> : <StoreStep />)}
            {step === 3 && <DoneStep />}
        </main>
    );
}
