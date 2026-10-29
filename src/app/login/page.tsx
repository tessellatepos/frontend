import { type FormEvent, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { SIGNED_IN_HOME, useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { authClient } from "@/utils/authClient.ts";
import { safeReturnTo } from "@/utils/returnTo.ts";
import { FormField } from "@/components/FormField.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

/** Email-or-username + password sign-in. */
export default function Login() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const status = useAuthStore((s) => s.status);
    const setupNeeded = useAuthStore((s) => s.setupNeeded);
    const refresh = useAuthStore((s) => s.refresh);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const errorRef = useRef<HTMLParagraphElement>(null);

    const returnTo = safeReturnTo(params.get("returnTo"), SIGNED_IN_HOME);

    useEffect(() => {
        if (error) errorRef.current?.focus();
    }, [error]);

    if (status === "unknown" || setupNeeded === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }
    if (setupNeeded)
        return (
            <Navigate
                to="/setup"
                replace
            />
        );
    if (status === "signed-in")
        return (
            <Navigate
                to={returnTo}
                replace
            />
        );

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const id = identifier.trim();
            const { error: authError } = id.includes("@")
                ? await authClient.signIn.email({ email: id, password })
                : await authClient.signIn.username({ username: id, password });
            if (authError) {
                setError(
                    authError.status === 429
                        ? "Too many attempts. Wait a moment and try again."
                        : "Incorrect email, username or password.",
                );
                return;
            }
            await refresh();
            void navigate(returnTo, { replace: true });
        } catch (err) {
            console.error("Sign-in failed", err);
            setError("Could not reach the server. Try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-5 p-5">
            <h1 className="text-3xl">Sign in</h1>
            <form
                onSubmit={(e) => void submit(e)}
                className="flex flex-col gap-4">
                <FormField
                    label="Email or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                />
                <FormField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />
                {error && (
                    <p
                        ref={errorRef}
                        tabIndex={-1}
                        role="alert"
                        className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={busy}
                    className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                    {busy ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </main>
    );
}
