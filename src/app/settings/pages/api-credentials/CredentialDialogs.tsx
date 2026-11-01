import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { FormField } from "@/components/FormField.tsx";
import { apiFetch } from "@/utils/apiFetch.ts";
import {
    type ApiCredential,
    type ApiCredentialSecret,
    CORE_SCOPES,
    createCredential,
    CredentialsApiError,
    listDeliveries,
    OVERLAPS,
    replayDelivery,
    revokeCredential,
    rotateSecret,
    type WebhookDelivery,
} from "./api.ts";
import { lines } from "./format.ts";

function failure(err: unknown): string {
    return err instanceof CredentialsApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

interface Location {
    id: string;
    name: string;
}

/** Scopes grouped by resource, e.g. catalog -> read, write. */
function groupedScopes(): [string, string[]][] {
    const groups = new Map<string, string[]>();
    for (const scope of CORE_SCOPES) {
        const [resource] = scope.split(":");
        groups.set(resource, [...(groups.get(resource) ?? []), scope]);
    }
    return [...groups];
}

interface CreateProps {
    open: boolean;
    onClose: () => void;
    onCreated: (secret: ApiCredentialSecret) => void;
}

/** Dialog form that creates a credential; the secret is shown separately. */
export function CreateCredentialDialog({
    open,
    onClose,
    onCreated,
}: CreateProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                {open && (
                    <CreateForm
                        onClose={onClose}
                        onCreated={onCreated}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function CreateForm({ onClose, onCreated }: Omit<CreateProps, "open">) {
    const [name, setName] = useState("");
    const [scopes, setScopes] = useState<string[]>([]);
    const [locationIds, setLocationIds] = useState<string[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [rate, setRate] = useState("");
    const [expires, setExpires] = useState("");
    const [origins, setOrigins] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                const res = await apiFetch("/api/v1/locations");
                if (!res.ok) throw new Error(String(res.status));
                setLocations((await res.json()) as Location[]);
            } catch {
                setError("Could not load locations.");
            }
        })();
    }, []);

    const toggle = (list: string[], value: string, on: boolean) =>
        on ? [...list, value] : list.filter((v) => v !== value);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError("");
        if (scopes.length === 0) return setError("Choose at least one scope.");
        if (locationIds.length === 0)
            return setError("Choose at least one location.");
        setBusy(true);
        try {
            const secret = await createCredential({
                name,
                scopes: scopes as never,
                location_ids: locationIds,
                ...(rate ? { rate_limit_per_minute: Number(rate) } : {}),
                ...(expires
                    ? { expires_at: new Date(expires).toISOString() }
                    : {}),
                ...(lines(origins).length ? { origins: lines(origins) } : {}),
                ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
            });
            onCreated(secret);
            onClose();
        } catch (err) {
            setError(failure(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form
            onSubmit={(e) => void submit(e)}
            className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto">
            <DialogHeader>
                <DialogTitle>New API credential</DialogTitle>
                <DialogDescription>
                    Lets another application, such as an online store, call the
                    gateway. The secret is shown once.
                </DialogDescription>
            </DialogHeader>
            <FormField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Online store"
                required
            />
            <fieldset className="flex flex-col gap-1">
                <legend className="text-sm font-medium">Scopes</legend>
                {groupedScopes().map(([resource, list]) => (
                    <div
                        key={resource}
                        className="flex items-center gap-4 text-sm">
                        <span className="w-24 capitalize">{resource}</span>
                        {list.map((scope) => (
                            <label
                                key={scope}
                                className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={scopes.includes(scope)}
                                    onChange={(e) =>
                                        setScopes(
                                            toggle(
                                                scopes,
                                                scope,
                                                e.target.checked,
                                            ),
                                        )
                                    }
                                />
                                {scope.split(":")[1]}
                            </label>
                        ))}
                    </div>
                ))}
            </fieldset>
            <fieldset className="flex flex-col gap-1">
                <legend className="text-sm font-medium">Locations</legend>
                {locations.map((l) => (
                    <label
                        key={l.id}
                        className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={locationIds.includes(l.id)}
                            onChange={(e) =>
                                setLocationIds(
                                    toggle(locationIds, l.id, e.target.checked),
                                )
                            }
                        />
                        {l.name}
                    </label>
                ))}
            </fieldset>
            <FormField
                label="Rate limit per minute (optional)"
                type="number"
                min={1}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
            />
            <FormField
                label="Expires (optional)"
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
            />
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="cred-origins"
                    className="text-sm font-medium">
                    Allowed origins (optional, one per line)
                </label>
                <textarea
                    id="cred-origins"
                    value={origins}
                    onChange={(e) => setOrigins(e.target.value)}
                    rows={2}
                    placeholder="https://shop.example.com"
                    aria-describedby="cred-origins-hint"
                    className="rounded border px-2 py-1 text-sm"
                />
                <p
                    id="cred-origins-hint"
                    className="text-xs text-gray-500">
                    Browsers on these origins may make read-only calls with the
                    client id alone. Leave empty for server-to-server use.
                </p>
            </div>
            <FormField
                label="Webhook URL (optional)"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://shop.example.com/hooks/tessellate"
            />
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}>
                    Cancel
                </Button>
                <button
                    type="submit"
                    disabled={busy}
                    className={buttonVariants()}>
                    Create
                </button>
            </DialogFooter>
        </form>
    );
}

function CopyRow({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex gap-2">
                <code
                    aria-label={label}
                    className="min-w-0 flex-1 break-all rounded border bg-gray-50 px-2 py-1 text-xs">
                    {value}
                </code>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        void navigator.clipboard
                            ?.writeText(value)
                            .then(() => setCopied(true))
                            .catch(() => undefined);
                    }}>
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
        </div>
    );
}

/** Shows the secrets once, after create or rotate. */
export function SecretDialog({
    secret,
    onClose,
}: {
    secret: ApiCredentialSecret | null;
    onClose: () => void;
}) {
    return (
        <Dialog
            open={secret !== null}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                {secret && (
                    <div className="flex flex-col gap-3">
                        <DialogHeader>
                            <DialogTitle>Save these now</DialogTitle>
                            <DialogDescription>
                                The secrets are shown only this once. If you
                                lose them, rotate the credential.
                            </DialogDescription>
                        </DialogHeader>
                        <CopyRow
                            label="Client ID"
                            value={secret.client_id}
                        />
                        <CopyRow
                            label="Client secret"
                            value={secret.client_secret}
                        />
                        {secret.credential.webhook_url && (
                            <CopyRow
                                label="Webhook signing secret"
                                value={secret.webhook_secret}
                            />
                        )}
                        <DialogFooter>
                            <button
                                onClick={onClose}
                                className={buttonVariants()}>
                                I&apos;ve saved them
                            </button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface ActionProps {
    credential: ApiCredential | null;
    onClose: () => void;
}

/** Rotate: new secret now, the old one valid for a chosen overlap. */
export function RotateDialog({
    credential,
    onClose,
    onRotated,
}: ActionProps & { onRotated: (secret: ApiCredentialSecret) => void }) {
    const [overlap, setOverlap] = useState<number>(0);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function rotate() {
        if (!credential) return;
        setBusy(true);
        setError("");
        try {
            onRotated(await rotateSecret(credential.id, overlap));
            onClose();
        } catch (err) {
            setError(failure(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog
            open={credential !== null}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rotate secret</DialogTitle>
                    <DialogDescription>
                        Issue a new secret for {credential?.name}. Update the
                        application before the old secret stops working.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="rotate-overlap"
                        className="text-sm font-medium">
                        Old secret
                    </label>
                    <select
                        id="rotate-overlap"
                        value={overlap}
                        onChange={(e) => setOverlap(Number(e.target.value))}
                        className="rounded border px-2 py-1">
                        {OVERLAPS.map((o) => (
                            <option
                                key={o.seconds}
                                value={o.seconds}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={busy}
                        onClick={() => void rotate()}>
                        Rotate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** Revoke: stops the credential for good, so it asks first. */
export function RevokeDialog({
    credential,
    onClose,
    onRevoked,
}: ActionProps & { onRevoked: (credential: ApiCredential) => void }) {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function revoke() {
        if (!credential) return;
        setBusy(true);
        setError("");
        try {
            onRevoked(await revokeCredential(credential.id));
            onClose();
        } catch (err) {
            setError(failure(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog
            open={credential !== null}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Revoke {credential?.name}?</DialogTitle>
                    <DialogDescription>
                        Calls using this credential fail immediately. This
                        can&apos;t be undone; create a new credential instead.
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={() => void revoke()}>
                        Revoke
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** Webhook delivery log with replay. */
export function DeliveriesDialog({ credential, onClose }: ActionProps) {
    const [rows, setRows] = useState<WebhookDelivery[]>([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const id = credential?.id;

    const load = useCallback(async (credentialId: string) => {
        try {
            setRows(await listDeliveries(credentialId));
            setError("");
        } catch (err) {
            setError(failure(err));
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        let current = true;
        listDeliveries(id)
            .then((list) => current && setRows(list))
            .catch((err: unknown) => current && setError(failure(err)));
        return () => {
            current = false;
        };
    }, [id]);

    async function replay(deliveryId: string) {
        if (!id) return;
        try {
            await replayDelivery(id, deliveryId);
            setNotice("Queued a replay.");
            await load(id);
        } catch (err) {
            setError(failure(err));
        }
    }

    return (
        <Dialog
            open={credential !== null}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Webhook deliveries: {credential?.name}
                    </DialogTitle>
                    <DialogDescription>
                        The 100 most recent. Failed deliveries retry with
                        backoff; replay sends the same event again.
                    </DialogDescription>
                </DialogHeader>
                {notice && (
                    <p
                        role="status"
                        className="text-sm text-green-700">
                        {notice}
                    </p>
                )}
                {error && (
                    <p
                        role="alert"
                        className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Time</th>
                                <th className="p-2">Event</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Attempts</th>
                                <th className="p-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b">
                                    <td className="p-2">
                                        {new Date(
                                            r.created_at,
                                        ).toLocaleString()}
                                    </td>
                                    <td className="p-2">
                                        {r.type}
                                        {r.replay_of ? " (replay)" : ""}
                                    </td>
                                    <td className="p-2">
                                        {r.status}
                                        {r.last_status_code
                                            ? ` (${r.last_status_code})`
                                            : r.last_error
                                              ? ` (${r.last_error})`
                                              : ""}
                                    </td>
                                    <td className="p-2">{r.attempts}</td>
                                    <td className="p-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => void replay(r.id)}>
                                            Replay
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && !error && (
                        <p className="p-2 text-sm">No deliveries yet.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
