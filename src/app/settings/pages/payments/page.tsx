import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { apiFetch } from "@/utils/apiFetch.ts";
import {
    failureMessage,
    getPaymentsStatus,
    listProcessors,
    type PaymentsStatus,
    type ProcessorStatus,
    updateProcessor,
} from "./api.ts";
import { changedConfig, configFields } from "./format.ts";

interface Location {
    id: string;
    name: string;
}

/** Settings -> Payments: owner-only online payment processors per location. */
export default function Payments() {
    const me = useAuthStore((s) => s.user);
    if (me?.role !== "owner") {
        return (
            <div className="p-5">
                <h1 className="text-2xl">Payments</h1>
                <p
                    role="alert"
                    className="mt-3">
                    You don&apos;t have access to manage payment settings.
                </p>
            </div>
        );
    }
    return <PaymentsSettings />;
}

function PaymentsSettings() {
    const [locations, setLocations] = useState<Location[] | null>(null);
    const [status, setStatus] = useState<PaymentsStatus | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        void (async () => {
            try {
                const res = await apiFetch("/api/v1/locations");
                if (!res.ok) throw new Error(String(res.status));
                setLocations((await res.json()) as Location[]);
            } catch {
                setError("Could not load locations. Try again.");
                setLocations([]);
            }
            try {
                setStatus(await getPaymentsStatus());
            } catch (err) {
                setError(failureMessage(err));
            }
        })();
    }, []);

    return (
        <div className="flex w-full flex-col gap-4 p-5">
            <h1 className="text-2xl">Payments</h1>
            <p className="max-w-2xl text-sm text-gray-600">
                Online payment processors let an online store, or an invoice,
                take payment away from the till. Each location enables and
                configures its own processors. Keys can be replaced but never
                read back.
            </p>
            {status && !status.online_payments_available && (
                <p
                    role="status"
                    className="max-w-2xl rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                    Online payments are unavailable. Processors send payment
                    confirmations to this server over the internet, which needs
                    <code> PUBLIC_URL </code>
                    set to an <code>https</code> address on the server
                    {status.public_url
                        ? ` (it is currently ${status.public_url}).`
                        : " (it is not set)."}{" "}
                    You can still prepare the settings below.
                </p>
            )}
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {locations === null && <Spinner />}
            {locations?.length === 0 && !error && (
                <p>No locations yet. Add a store first.</p>
            )}
            {locations?.map((location) => (
                <LocationSection
                    key={location.id}
                    location={location}
                />
            ))}
        </div>
    );
}

function LocationSection({ location }: { location: Location }) {
    const [processors, setProcessors] = useState<ProcessorStatus[] | null>(
        null,
    );
    const [error, setError] = useState("");

    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        void (async () => {
            try {
                setProcessors(await listProcessors(location.id));
                setError("");
            } catch (err) {
                setProcessors([]);
                setError(failureMessage(err));
            }
        })();
    }, [location.id, attempt]);

    const replace = (next: ProcessorStatus) =>
        setProcessors((list) =>
            (list ?? []).map((p) => (p.id === next.id ? next : p)),
        );

    return (
        <section
            aria-label={`Payments at ${location.name}`}
            className="flex flex-col gap-3 rounded border p-4">
            <h2 className="text-lg">{location.name}</h2>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}{" "}
                    <button
                        className="underline"
                        onClick={() => {
                            setProcessors(null);
                            setAttempt((n) => n + 1);
                        }}>
                        Retry
                    </button>
                </p>
            )}
            {processors === null && <Spinner />}
            {processors?.length === 0 && !error && (
                <p className="text-sm">
                    No payment processors are installed on this server.
                </p>
            )}
            {processors?.map((p) => (
                <ProcessorCard
                    key={p.id}
                    processor={p}
                    locationId={location.id}
                    onChange={replace}
                />
            ))}
        </section>
    );
}

interface CardProps {
    processor: ProcessorStatus;
    locationId: string;
    onChange: (next: ProcessorStatus) => void;
}

function ProcessorCard({ processor, locationId, onChange }: CardProps) {
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [copied, setCopied] = useState(false);
    const fields = configFields(processor.id, processor.configured_keys);
    const pending = changedConfig(drafts);

    async function save(change: Parameters<typeof updateProcessor>[2]) {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            onChange(await updateProcessor(processor.id, locationId, change));
            return true;
        } catch (err) {
            setError(failureMessage(err));
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function copy() {
        if (!processor.webhook_url) return;
        try {
            await navigator.clipboard.writeText(processor.webhook_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Could not copy. Select the address and copy it.");
        }
    }

    return (
        <div className="flex flex-col gap-3 rounded border p-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">{processor.label}</h3>
                    <p className="text-xs text-gray-500">
                        {[
                            processor.capabilities.checkout &&
                                "Hosted checkout",
                            processor.capabilities.invoice && "Invoices",
                        ]
                            .filter(Boolean)
                            .join(", ") || "No capabilities"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className={
                            processor.enabled
                                ? "text-sm text-green-700"
                                : "text-sm text-gray-500"
                        }>
                        {processor.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Button
                        size="sm"
                        variant={processor.enabled ? "outline" : "default"}
                        disabled={busy}
                        aria-label={`${processor.enabled ? "Disable" : "Enable"} ${processor.label}`}
                        onClick={() =>
                            void save({ enabled: !processor.enabled })
                        }>
                        {processor.enabled ? "Disable" : "Enable"}
                    </Button>
                </div>
            </div>

            <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    void save({ config: pending }).then((ok) => {
                        if (!ok) return;
                        setDrafts({});
                        setNotice("Keys saved.");
                    });
                }}>
                {fields.map((field) => {
                    const set = processor.configured_keys.includes(field.key);
                    const id = `${locationId}-${processor.id}-${field.key}`;
                    return (
                        <div
                            key={field.key}
                            className="flex flex-col gap-1">
                            <label
                                htmlFor={id}
                                className="text-sm font-medium">
                                {field.label}{" "}
                                <span className="font-normal text-gray-500">
                                    {set ? "(set)" : "(not set)"}
                                </span>
                            </label>
                            <Input
                                id={id}
                                type="password"
                                autoComplete="off"
                                value={drafts[field.key] ?? ""}
                                onChange={(e) =>
                                    setDrafts({
                                        ...drafts,
                                        [field.key]: e.target.value,
                                    })
                                }
                                placeholder={
                                    set
                                        ? "•••••••• saved, type to replace"
                                        : "Not set"
                                }
                            />
                            {field.hint && (
                                <p className="text-xs text-gray-500">
                                    {field.hint}
                                </p>
                            )}
                        </div>
                    );
                })}
                {fields.length > 0 && (
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                busy || Object.keys(pending).length === 0
                            }>
                            Save keys
                        </Button>
                        {notice && (
                            <span
                                role="status"
                                className="text-sm text-green-700">
                                {notice}
                            </span>
                        )}
                    </div>
                )}
            </form>

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Webhook URL</span>
                {processor.webhook_url ? (
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs">
                            {processor.webhook_url}
                        </code>
                        <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Copy ${processor.label} webhook URL`}
                            onClick={() => void copy()}>
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">
                        Not available until <code>PUBLIC_URL</code> is an https
                        address.
                    </p>
                )}
            </div>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
