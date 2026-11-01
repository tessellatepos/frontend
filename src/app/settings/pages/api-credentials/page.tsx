import { useEffect, useState } from "react";
import { buttonVariants, Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { type ApiCredential, type ApiCredentialSecret } from "./api.ts";
import { useCredentialsStore } from "./useCredentialsStore.ts";
import { credentialStatus } from "./format.ts";
import {
    CreateCredentialDialog,
    DeliveriesDialog,
    RevokeDialog,
    RotateDialog,
    SecretDialog,
} from "./CredentialDialogs.tsx";

/** Settings -> API credentials: owner-only management of gateway clients. */
export default function ApiCredentials() {
    const me = useAuthStore((s) => s.user);
    if (me?.role !== "owner") {
        return (
            <div className="p-5">
                <h1 className="text-2xl">API credentials</h1>
                <p
                    role="alert"
                    className="mt-3">
                    You don&apos;t have access to manage API credentials.
                </p>
            </div>
        );
    }
    return <CredentialsTable />;
}

function CredentialsTable() {
    const { credentials, loading, error, load } = useCredentialsStore();
    const [creating, setCreating] = useState(false);
    const [secret, setSecret] = useState<ApiCredentialSecret | null>(null);
    const [rotating, setRotating] = useState<ApiCredential | null>(null);
    const [revoking, setRevoking] = useState<ApiCredential | null>(null);
    const [viewing, setViewing] = useState<ApiCredential | null>(null);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="flex w-full flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">API credentials</h1>
                <button
                    onClick={() => setCreating(true)}
                    className={buttonVariants()}>
                    New credential
                </button>
            </div>
            <p className="max-w-2xl text-sm text-gray-600">
                A credential lets another application, such as an online store,
                read and write this store&apos;s data through the gateway.
                Selling online needs this store to be reachable at a public
                address: set <code>PUBLIC_URL</code> on the server first.
            </p>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Name</th>
                        <th className="p-2">Client ID</th>
                        <th className="p-2">Scopes</th>
                        <th className="p-2">Last used</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {credentials.map((c) => {
                        const status = credentialStatus(c);
                        const live = status === "Active";
                        return (
                            <tr
                                key={c.id}
                                className="border-b">
                                <td className="p-2">{c.name}</td>
                                <td className="p-2">
                                    <code className="text-xs">{c.id}</code>
                                </td>
                                <td className="p-2">{c.scopes.join(", ")}</td>
                                <td className="p-2">
                                    {c.last_used_at
                                        ? new Date(
                                              c.last_used_at,
                                          ).toLocaleString()
                                        : "Never"}
                                </td>
                                <td className="p-2">{status}</td>
                                <td className="flex gap-2 p-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={!live}
                                        aria-label={`Rotate secret for ${c.name}`}
                                        onClick={() => setRotating(c)}>
                                        Rotate
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={!c.webhook_url}
                                        aria-label={`Webhook deliveries for ${c.name}`}
                                        onClick={() => setViewing(c)}>
                                        Deliveries
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={!live}
                                        aria-label={`Revoke ${c.name}`}
                                        onClick={() => setRevoking(c)}>
                                        Revoke
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {loading && <Spinner />}
            {!loading && credentials.length === 0 && !error && (
                <p>No API credentials yet.</p>
            )}
            <CreateCredentialDialog
                open={creating}
                onClose={() => setCreating(false)}
                onCreated={(created) => {
                    setSecret(created);
                    void load();
                }}
            />
            <SecretDialog
                secret={secret}
                onClose={() => setSecret(null)}
            />
            <RotateDialog
                credential={rotating}
                onClose={() => setRotating(null)}
                onRotated={setSecret}
            />
            <RevokeDialog
                credential={revoking}
                onClose={() => setRevoking(null)}
                onRevoked={() => void load()}
            />
            <DeliveriesDialog
                credential={viewing}
                onClose={() => setViewing(null)}
            />
        </div>
    );
}
