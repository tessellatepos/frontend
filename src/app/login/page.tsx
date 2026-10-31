import { type FormEvent, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { inSetupWizard, useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { authClient } from "@/utils/authClient.ts";
import { safeReturnTo } from "@/utils/returnTo.ts";
import { FormField } from "@/components/FormField.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { apiFetch } from "@/utils/apiFetch.ts";

interface PublicProvider {
    id: string;
    label: string;
    kind: "oidc" | "oauth" | "social" | "custom";
}

/** Email-or-username + password sign-in. */
export default function Login() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const status = useAuthStore((s) => s.status);
    const setupNeeded = useAuthStore((s) => s.setupNeeded);
    const wizard = useAuthStore(inSetupWizard);
    const refresh = useAuthStore((s) => s.refresh);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [providers, setProviders] = useState<PublicProvider[]>([]);
    const errorRef = useRef<HTMLParagraphElement>(null);

    const returnTo = safeReturnTo(params.get("returnTo"), "/");
    // A provider redirect that failed comes back as ?error=<code>&...
    const providerError = params.get("error");

    useEffect(() => {
        apiFetch("/api/v1/auth-providers/public")
            .then((r) => (r.ok ? (r.json() as Promise<PublicProvider[]>) : []))
            .then(setProviders)
            .catch(() => setProviders([]));
    }, []);

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
    if (wizard)
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

    async function signInWith(provider: PublicProvider) {
        setError("");
        try {
            // The provider returns the browser to callbackURL, with ?error=
            // appended on failure. Landing on /login keeps the error visible
            // (a signed-in user is forwarded on to returnTo from here).
            const callbackURL = `/login?returnTo=${encodeURIComponent(returnTo)}&provider=${encodeURIComponent(provider.id)}`;
            const { error: authError } = await authClient.signIn.social({
                provider: provider.id,
                callbackURL,
            });
            if (authError)
                setError(`Could not start sign-in with ${provider.label}.`);
        } catch (err) {
            console.error("Provider sign-in failed", err);
            setError("Could not reach the server. Try again.");
        }
    }

    // custom methods (e.g. a plugin's PIN pad) draw their own UI
    const redirectProviders = providers.filter((p) => p.kind !== "custom");
    const label = providers.find((p) => p.id === params.get("provider"))?.label;
    const providerMessage = !providerError
        ? ""
        : providerError === "access_denied"
          ? `Your account isn't allowed to sign in${label ? ` with ${label}` : " this way"}.`
          : "Sign-in with that provider failed. Try again or use another method.";

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
            {providerMessage && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {providerMessage}
                </p>
            )}
            {redirectProviders.length > 0 && (
                <div
                    role="group"
                    aria-label="Other ways to sign in"
                    className="flex flex-col gap-2">
                    {redirectProviders.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => void signInWith(p)}
                            className="rounded border px-4 py-2">
                            {p.label}
                        </button>
                    ))}
                </div>
            )}
            <PluginHost mount={PluginUIMountPoint.AUTH_METHOD} />
        </main>
    );
}
