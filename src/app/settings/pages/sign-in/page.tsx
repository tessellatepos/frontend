import { type FormEvent, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { FormField } from "@/components/FormField.tsx";
import {
    type AuthProviderView,
    listProviders,
    saveProvider,
    type ProviderUpdate,
} from "./api.ts";

/** Settings -> Sign-in methods: owner-only provider configuration. */
export default function SignInMethods() {
    const role = useAuthStore((s) => s.user?.role);
    if (role !== "owner") {
        return (
            <div className="p-5">
                <h1 className="text-2xl">Sign-in methods</h1>
                <p
                    role="alert"
                    className="mt-3">
                    You don&apos;t have access to sign-in methods.
                </p>
            </div>
        );
    }
    return <ProviderList />;
}

function badges(p: AuthProviderView): string[] {
    return [
        p.enabled ? "Enabled" : "Disabled",
        p.configured ? "Configured" : "Needs configuration",
    ];
}

function ProviderList() {
    const [providers, setProviders] = useState<AuthProviderView[] | null>(null);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        listProviders()
            .then(setProviders)
            .catch((err) => {
                console.error("Failed to load sign-in methods", err);
                setError("Could not load sign-in methods.");
            });
    }, []);

    const selected = providers?.find((p) => p.id === selectedId);

    return (
        <div className="flex w-full max-w-2xl flex-col gap-4 p-5">
            <h1 className="text-2xl">Sign-in methods</h1>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {!providers && !error && <Spinner />}
            {providers?.length === 0 && (
                <p>
                    No sign-in methods yet. Sign-in methods are added by
                    plugins; install a plugin that provides one and it will
                    appear here for you to configure.
                </p>
            )}
            <ul className="flex flex-col gap-2">
                {providers?.map((p) => (
                    <li
                        key={p.id}
                        className="flex items-center justify-between rounded border p-3">
                        <div>
                            <div className="font-medium">{p.label}</div>
                            <div className="flex gap-2 text-xs">
                                {badges(p).map((b) => (
                                    <span
                                        key={b}
                                        className="rounded bg-gray-200 px-2 py-0.5">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedId(p.id)}
                            aria-label={`Edit ${p.label}`}
                            className="rounded border px-3 py-1">
                            Edit
                        </button>
                    </li>
                ))}
            </ul>
            {selected && (
                <ProviderEditor
                    key={selected.id}
                    provider={selected}
                    onSaved={(updated) =>
                        setProviders((list) =>
                            (list ?? []).map((p) =>
                                p.id === updated.id ? updated : p,
                            ),
                        )
                    }
                />
            )}
        </div>
    );
}

function ProviderEditor({
    provider,
    onSaved,
}: {
    provider: AuthProviderView;
    onSaved: (p: AuthProviderView) => void;
}) {
    const [enabled, setEnabled] = useState(provider.enabled);
    const [discoveryUrl, setDiscoveryUrl] = useState(
        provider.fields.discoveryUrl ?? "",
    );
    const [clientId, setClientId] = useState(provider.fields.clientId ?? "");
    const [scopes, setScopes] = useState("");
    // The stored secret is never shown; typing is only possible after the
    // owner asks to replace it (or when none is set yet).
    const [replacing, setReplacing] = useState(!provider.fields.hasSecret);
    const [secret, setSecret] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        setError("");
        const update: ProviderUpdate = { enabled, clientId };
        if (provider.kind === "oidc") update.discoveryUrl = discoveryUrl;
        if (scopes.trim()) {
            update.scopes = scopes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }
        if (replacing && secret) update.clientSecret = secret;
        try {
            const updated = await saveProvider(provider.id, update);
            onSaved(updated);
            setSecret("");
            setReplacing(!updated.fields.hasSecret);
            setMessage("Saved.");
        } catch (err) {
            console.error("Failed to save sign-in method", err);
            setError(
                err instanceof Error && err.message
                    ? `Could not save: ${err.message}`
                    : "Could not save.",
            );
        } finally {
            setBusy(false);
        }
    }

    const redirectUrl = `${window.location.origin}/api/v1/auth/callback/${provider.id}`;

    return (
        <form
            onSubmit={(e) => void submit(e)}
            aria-label={`Settings for ${provider.label}`}
            className="flex flex-col gap-3 rounded border p-4">
            <h2 className="text-xl">{provider.label}</h2>
            {provider.kind === "custom" && (
                <p
                    role="note"
                    className="rounded bg-yellow-100 p-2 text-sm">
                    This sign-in method runs plugin code inside the sign-in
                    process. Only enable it if you trust the plugin &quot;
                    {provider.plugin}&quot;.
                </p>
            )}
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                />
                Enabled
            </label>
            {provider.kind === "oidc" && (
                <FormField
                    label="Discovery URL"
                    type="url"
                    value={discoveryUrl}
                    onChange={(e) => setDiscoveryUrl(e.target.value)}
                    placeholder="https://idp.example.com/.well-known/openid-configuration"
                />
            )}
            <FormField
                label="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                autoComplete="off"
            />
            {replacing ? (
                <FormField
                    label="Client secret"
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    autoComplete="new-password"
                    hint="Stored encrypted and never shown again."
                />
            ) : (
                <div className="flex items-center gap-3">
                    <span>Client secret: a secret is set</span>
                    <button
                        type="button"
                        onClick={() => setReplacing(true)}
                        className="rounded border px-3 py-1">
                        Replace secret
                    </button>
                </div>
            )}
            <FormField
                label="Scopes"
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
                hint="Comma-separated. Leave empty to keep the current scopes."
            />
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="redirect-url"
                    className="text-sm font-medium">
                    Redirect URL
                </label>
                <input
                    id="redirect-url"
                    readOnly
                    value={redirectUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="rounded border bg-gray-50 px-2 py-1 text-sm"
                />
                <p className="text-xs text-gray-500">
                    Register this at the provider as an allowed redirect URI.
                </p>
            </div>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {message && (
                <p
                    role="status"
                    className="text-sm text-green-700">
                    {message}
                </p>
            )}
            <button
                type="submit"
                disabled={busy}
                className="self-start rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                {busy ? "Saving…" : "Save"}
            </button>
        </form>
    );
}
