import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
    ASSIGNABLE_ROLES,
    type ManagedUser,
    updateUser,
    UsersApiError,
} from "./api.ts";
import { useUsersStore } from "./useUsersStore.ts";
import { CreateUserDialog, ResetPasswordDialog } from "./UserDialogs.tsx";

/** Settings -> Users: owner-only staff management. */
export default function Users() {
    const me = useAuthStore((s) => s.user);
    if (me?.role !== "owner") {
        return (
            <div className="p-5">
                <h1 className="text-2xl">Users</h1>
                <p
                    role="alert"
                    className="mt-3">
                    You don&apos;t have access to manage users.
                </p>
            </div>
        );
    }
    return <UsersTable myId={me.id} />;
}

function UsersTable({ myId }: { myId: string }) {
    const { users, nextCursor, loading, error, load, loadMore, upsert } =
        useUsersStore();
    const [creating, setCreating] = useState(false);
    const [resetting, setResetting] = useState<ManagedUser | null>(null);
    const [notice, setNotice] = useState("");
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        void load();
    }, [load]);

    async function change(
        user: ManagedUser,
        patch: { role?: string; banned?: boolean },
    ) {
        setActionError("");
        setNotice("");
        try {
            upsert(await updateUser(user.id, patch));
        } catch (err) {
            setActionError(
                err instanceof UsersApiError
                    ? err.message
                    : "Could not reach the server. Try again.",
            );
        }
    }

    return (
        <div className="flex w-full flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Users</h1>
                <button
                    onClick={() => {
                        setNotice("");
                        setCreating(true);
                    }}
                    className="rounded bg-blue-500 px-4 py-2 text-white">
                    Add user
                </button>
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
                        <th className="p-2">Username</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => {
                        const self = u.id === myId;
                        return (
                            <tr
                                key={u.id}
                                className="border-b">
                                <td className="p-2">{u.name}</td>
                                <td className="p-2">{u.username}</td>
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">
                                    <select
                                        aria-label={`Role for ${u.name}`}
                                        value={u.role}
                                        disabled={self}
                                        onChange={(e) =>
                                            void change(u, {
                                                role: e.target.value,
                                            })
                                        }
                                        className="rounded border px-1 py-1 disabled:opacity-60">
                                        {u.role === "owner" && (
                                            <option value="owner">owner</option>
                                        )}
                                        {ASSIGNABLE_ROLES.map((r) => (
                                            <option
                                                key={r}
                                                value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2">
                                    {u.banned ? "Banned" : "Active"}
                                </td>
                                <td className="flex gap-2 p-2">
                                    <button
                                        disabled={self}
                                        onClick={() =>
                                            void change(u, {
                                                banned: !u.banned,
                                            })
                                        }
                                        aria-label={`${u.banned ? "Unban" : "Ban"} ${u.name}`}
                                        className="rounded border px-2 py-1 disabled:opacity-50">
                                        {u.banned ? "Unban" : "Ban"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNotice("");
                                            setResetting(u);
                                        }}
                                        aria-label={`Reset password for ${u.name}`}
                                        className="rounded border px-2 py-1">
                                        Reset password
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {loading && <Spinner />}
            {!loading && users.length === 0 && !error && <p>No users yet.</p>}
            {nextCursor && (
                <button
                    onClick={() => void loadMore()}
                    disabled={loading}
                    className="self-start rounded border px-4 py-2 disabled:opacity-50">
                    Load more
                </button>
            )}
            <CreateUserDialog
                open={creating}
                onClose={() => setCreating(false)}
                onCreated={(u) => {
                    upsert(u);
                    setNotice(`Created ${u.name}.`);
                }}
            />
            <ResetPasswordDialog
                user={resetting}
                onClose={() => setResetting(null)}
                onDone={(u) => setNotice(`Password updated for ${u.name}.`)}
            />
        </div>
    );
}
