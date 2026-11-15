import { type FormEvent, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { FormField } from "@/components/FormField.tsx";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { roleHasScope } from "@/utils/scopes.ts";
import {
    deleteMember,
    exportMember,
    listMemberSources,
    type Member,
    type MemberSignupPolicy,
    type MemberSourceView,
    type MemberStatus,
    memberRedirectUrl,
    MembersApiError,
    saveMemberSource,
    updateMember,
} from "./api.ts";
import { useMembersStore } from "./useMembersStore.ts";

const STATUS_LABEL: Record<MemberStatus, string> = {
    active: "Active",
    pending: "Waiting for approval",
    disabled: "Disabled",
};

function errorText(err: unknown): string {
    return err instanceof MembersApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

/**
 * Settings -> Members: people who sign in through a plugin's member login.
 * They are not staff; staff are managed under Users.
 */
export default function Members() {
    const role = useAuthStore((s) => s.user?.role);
    if (!roleHasScope(role, "members:read")) {
        return (
            <div className="p-5">
                <h1 className="text-2xl">Members</h1>
                <p
                    role="alert"
                    className="mt-3">
                    You don&apos;t have access to members.
                </p>
            </div>
        );
    }
    return (
        <div className="flex w-full flex-col gap-8 p-5">
            <MembersTable
                canWrite={roleHasScope(role, "members:write")}
                canAdmin={roleHasScope(role, "members:admin")}
            />
            {roleHasScope(role, "members:admin") && <MemberLogins />}
        </div>
    );
}

function MembersTable({
    canWrite,
    canAdmin,
}: {
    canWrite: boolean;
    canAdmin: boolean;
}) {
    const {
        members,
        nextCursor,
        loading,
        error,
        load,
        loadMore,
        upsert,
        remove,
    } = useMembersStore();
    const [text, setText] = useState("");
    const [plugin, setPlugin] = useState("");
    const [status, setStatus] = useState<MemberStatus | "">("");
    const [notice, setNotice] = useState("");
    const [actionError, setActionError] = useState("");

    const filter = {
        text: text.trim() || undefined,
        plugin: plugin.trim() || undefined,
        status: status || undefined,
    };

    useEffect(() => {
        void load({
            text: text.trim() || undefined,
            plugin: plugin.trim() || undefined,
            status: status || undefined,
        });
    }, [load, text, plugin, status]);

    async function act(run: () => Promise<void>) {
        setActionError("");
        setNotice("");
        try {
            await run();
        } catch (err) {
            setActionError(errorText(err));
        }
    }

    const setMemberStatus = (m: Member, next: MemberStatus, done: string) =>
        act(async () => {
            upsert(await updateMember(m.id, { status: next }));
            setNotice(done);
        });

    const download = (m: Member) =>
        act(async () => {
            const data = await exportMember(m.id);
            const url = URL.createObjectURL(
                new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `member-${m.id}.json`;
            link.click();
            URL.revokeObjectURL(url);
        });

    const del = (m: Member) =>
        act(async () => {
            if (
                !window.confirm(
                    `Delete ${m.display_name}? This removes them and ends their sessions.`,
                )
            ) {
                return;
            }
            await deleteMember(m.id);
            remove(m.id);
            setNotice(`Deleted ${m.display_name}.`);
        });

    return (
        <section
            aria-labelledby="members-heading"
            className="flex flex-col gap-4">
            <div>
                <h1
                    id="members-heading"
                    className="text-2xl">
                    Members
                </h1>
                <p className="text-sm text-gray-600">
                    People who sign in through a plugin&apos;s member login.
                    They are not staff and cannot use the till or settings.
                </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <FormField
                    label="Search"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <FormField
                    label="Plugin"
                    value={plugin}
                    onChange={(e) => setPlugin(e.target.value)}
                />
                <label className="flex flex-col gap-1 text-sm font-medium">
                    Status
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as MemberStatus | "")
                        }
                        className="rounded border px-2 py-2 font-normal">
                        <option value="">All</option>
                        {(Object.keys(STATUS_LABEL) as MemberStatus[]).map(
                            (s) => (
                                <option
                                    key={s}
                                    value={s}>
                                    {STATUS_LABEL[s]}
                                </option>
                            ),
                        )}
                    </select>
                </label>
            </div>
            {notice && (
                <p
                    role="status"
                    className="text-sm text-green-700">
                    {notice}
                </p>
            )}
            {(error || actionError) && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {actionError || error}
                </p>
            )}
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Plugin</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Last sign-in</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((m) => (
                        <tr
                            key={m.id}
                            className="border-b">
                            <td className="p-2">{m.display_name}</td>
                            <td className="p-2">{m.email}</td>
                            <td className="p-2">{m.plugin}</td>
                            <td className="p-2">{STATUS_LABEL[m.status]}</td>
                            <td className="p-2">
                                {m.last_login_at
                                    ? new Date(
                                          m.last_login_at,
                                      ).toLocaleDateString()
                                    : "Never"}
                            </td>
                            <td className="flex flex-wrap gap-2 p-2">
                                {canWrite && m.status === "pending" && (
                                    <button
                                        onClick={() =>
                                            void setMemberStatus(
                                                m,
                                                "active",
                                                `Approved ${m.display_name}.`,
                                            )
                                        }
                                        aria-label={`Approve ${m.display_name}`}
                                        className="rounded border px-2 py-1">
                                        Approve
                                    </button>
                                )}
                                {canWrite && m.status === "active" && (
                                    <button
                                        onClick={() =>
                                            void setMemberStatus(
                                                m,
                                                "disabled",
                                                `Disabled ${m.display_name}.`,
                                            )
                                        }
                                        aria-label={`Disable ${m.display_name}`}
                                        className="rounded border px-2 py-1">
                                        Disable
                                    </button>
                                )}
                                {canWrite && m.status === "disabled" && (
                                    <button
                                        onClick={() =>
                                            void setMemberStatus(
                                                m,
                                                "active",
                                                `Enabled ${m.display_name}.`,
                                            )
                                        }
                                        aria-label={`Enable ${m.display_name}`}
                                        className="rounded border px-2 py-1">
                                        Enable
                                    </button>
                                )}
                                {canAdmin && (
                                    <>
                                        <button
                                            onClick={() => void download(m)}
                                            aria-label={`Export ${m.display_name}`}
                                            className="rounded border px-2 py-1">
                                            Export
                                        </button>
                                        <button
                                            onClick={() => void del(m)}
                                            aria-label={`Delete ${m.display_name}`}
                                            className="rounded border px-2 py-1 text-red-700">
                                            Delete
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {loading && <Spinner />}
            {!loading && members.length === 0 && !error && (
                <p>
                    {filter.text || filter.plugin || filter.status
                        ? "No members match."
                        : "No members yet. Members appear here when someone signs in through a plugin's member login."}
                </p>
            )}
            {nextCursor && (
                <button
                    onClick={() => void loadMore(filter)}
                    disabled={loading}
                    className="self-start rounded border px-4 py-2 disabled:opacity-50">
                    Load more
                </button>
            )}
        </section>
    );
}

function MemberLogins() {
    const [sources, setSources] = useState<MemberSourceView[] | null>(null);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        listMemberSources()
            .then(setSources)
            .catch((err) => {
                console.error("Failed to load member logins", err);
                setError("Could not load member logins.");
            });
    }, []);

    const current = sources?.find((s) => `${s.plugin}/${s.id}` === selected);

    return (
        <section
            aria-labelledby="logins-heading"
            className="flex max-w-2xl flex-col gap-4">
            <div>
                <h2
                    id="logins-heading"
                    className="text-xl">
                    Member logins
                </h2>
                <p className="text-sm text-gray-600">
                    How members sign in, added by plugins. Each login needs to
                    be enabled and given credentials from the identity provider
                    before it appears to members.
                </p>
            </div>
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {!sources && !error && <Spinner />}
            {sources?.length === 0 && (
                <p>
                    No member logins yet. A plugin that has members adds its
                    login here.
                </p>
            )}
            <ul className="flex flex-col gap-2">
                {sources?.map((s) => (
                    <li
                        key={`${s.plugin}/${s.id}`}
                        className="flex items-center justify-between rounded border p-3">
                        <div>
                            <div className="font-medium">
                                {s.label}{" "}
                                <span className="text-sm font-normal text-gray-600">
                                    from {s.plugin}
                                </span>
                            </div>
                            <div className="flex gap-2 text-xs">
                                {[
                                    s.enabled ? "Enabled" : "Disabled",
                                    s.configured
                                        ? "Configured"
                                        : "Needs credentials",
                                    s.signup === "open"
                                        ? "Anyone can join"
                                        : "Joins need approval",
                                ].map((b) => (
                                    <span
                                        key={b}
                                        className="rounded bg-gray-200 px-2 py-0.5">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelected(`${s.plugin}/${s.id}`)}
                            aria-label={`Edit ${s.label} from ${s.plugin}`}
                            className={buttonVariants({ variant: "outline" })}>
                            Edit
                        </button>
                    </li>
                ))}
            </ul>
            {current && (
                <SourceEditor
                    key={`${current.plugin}/${current.id}`}
                    source={current}
                    onSaved={(updated) =>
                        setSources((list) =>
                            (list ?? []).map((s) =>
                                s.plugin === updated.plugin &&
                                s.id === updated.id
                                    ? updated
                                    : s,
                            ),
                        )
                    }
                />
            )}
        </section>
    );
}

function SourceEditor({
    source,
    onSaved,
}: {
    source: MemberSourceView;
    onSaved: (s: MemberSourceView) => void;
}) {
    const [enabled, setEnabled] = useState(source.enabled);
    const [signup, setSignup] = useState<MemberSignupPolicy>(source.signup);
    const [clientId, setClientId] = useState(source.fields.clientId ?? "");
    // The stored secret is never shown; typing is only possible after the
    // owner asks to replace it (or when none is set yet).
    const [replacing, setReplacing] = useState(!source.fields.hasSecret);
    const [secret, setSecret] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        setError("");
        try {
            const updated = await saveMemberSource(source.plugin, source.id, {
                enabled,
                // Only an explicit change overrides the plugin's choice.
                ...(signup !== source.signup ? { signup } : {}),
                clientId,
                ...(replacing && secret ? { clientSecret: secret } : {}),
            });
            onSaved(updated);
            setSecret("");
            setReplacing(!updated.fields.hasSecret);
            setMessage("Saved.");
        } catch (err) {
            console.error("Failed to save member login", err);
            setError(`Could not save: ${errorText(err)}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form
            onSubmit={(e) => void submit(e)}
            aria-label={`Settings for ${source.label} from ${source.plugin}`}
            className="flex flex-col gap-3 rounded border p-4">
            <h3 className="text-lg">
                {source.label} from {source.plugin}
            </h3>
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                />
                Enabled
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
                New members
                <select
                    value={signup}
                    onChange={(e) =>
                        setSignup(e.target.value as MemberSignupPolicy)
                    }
                    className="rounded border px-2 py-2 font-normal">
                    <option value="open">Join immediately</option>
                    <option value="approval">Wait for staff to approve</option>
                </select>
            </label>
            <FormField
                label="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
            />
            {replacing ? (
                <FormField
                    label="Client secret"
                    type="password"
                    autoComplete="off"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                />
            ) : (
                <div className="flex items-center gap-3 text-sm">
                    <span>A client secret is saved.</span>
                    <button
                        type="button"
                        onClick={() => setReplacing(true)}
                        className="rounded border px-2 py-1">
                        Replace secret
                    </button>
                </div>
            )}
            <p className="text-sm">
                Register this redirect URL with the identity provider:{" "}
                <code className="break-all">
                    {memberRedirectUrl(source.plugin, source.id)}
                </code>
            </p>
            {message && (
                <p
                    role="status"
                    className="text-sm text-green-700">
                    {message}
                </p>
            )}
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <button
                type="submit"
                disabled={busy}
                className={buttonVariants()}>
                Save
            </button>
        </form>
    );
}
