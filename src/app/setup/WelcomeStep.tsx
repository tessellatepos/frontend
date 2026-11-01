import { FormField } from "@/components/FormField.tsx";
import { StepHeading } from "./StepHeading.tsx";

interface Props {
    tokenRequired: boolean;
    token: string;
    onToken: (token: string) => void;
    onContinue: () => void;
    /** Why the last attempt bounced back here, if it did. */
    error?: string;
    /** True while the token is being checked. */
    busy?: boolean;
}

/** Step 1: welcome and the setup token. */
export function WelcomeStep({
    tokenRequired,
    token,
    onToken,
    onContinue,
    error,
    busy,
}: Props) {
    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
                e.preventDefault();
                onContinue();
            }}>
            <StepHeading>Welcome to Tessellate</StepHeading>
            <p>
                This takes a minute: create the owner account, describe your
                store, and you are ready to sell.
            </p>
            {tokenRequired && (
                <FormField
                    label="Setup token"
                    value={token}
                    onChange={(e) => onToken(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    required
                    error={error}
                    hint='The setup token is printed in the server log the first time the backend starts (look for "setup token"), or it is the SETUP_TOKEN value set in the server&apos;s environment.'
                />
            )}
            <button
                type="submit"
                disabled={busy}
                className="self-start rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                {busy ? "Checking…" : "Continue"}
            </button>
        </form>
    );
}
