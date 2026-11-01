import { type FormEvent, useState } from "react";
import { buttonVariants } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { FormField } from "@/components/FormField.tsx";
import {
    ASSIGNABLE_ROLES,
    createUser,
    type ManagedUser,
    MIN_PASSWORD,
    resetPassword,
    UsersApiError,
} from "./api.ts";

/** Password + confirm validation shared by both dialogs. */
function passwordError(password: string, confirm: string): string {
    if (password.length < MIN_PASSWORD)
        return `Use at least ${MIN_PASSWORD} characters.`;
    if (password !== confirm) return "The passwords don't match.";
    return "";
}

function failure(err: unknown): string {
    return err instanceof UsersApiError
        ? err.message
        : "Could not reach the server. Try again.";
}

interface CreateProps {
    open: boolean;
    onClose: () => void;
    onCreated: (user: ManagedUser) => void;
}

/** Dialog form that creates a manager, cashier or viewer. */
export function CreateUserDialog({ open, onClose, onCreated }: CreateProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                {/* Remounts on each open so the form starts empty. */}
                {open && (
                    <CreateUserForm
                        onClose={onClose}
                        onCreated={onCreated}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function CreateUserForm({ onClose, onCreated }: Omit<CreateProps, "open">) {
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirm: "",
        role: "cashier",
    });
    const [fieldError, setFieldError] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (key: keyof typeof form) => (value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    async function submit(event: FormEvent) {
        event.preventDefault();
        const problem = passwordError(form.password, form.confirm);
        setFieldError(problem);
        setError("");
        if (problem) return;
        setBusy(true);
        try {
            onCreated(
                await createUser({
                    name: form.name,
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                }),
            );
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
            className="flex flex-col gap-3">
            <DialogHeader>
                <DialogTitle>Add user</DialogTitle>
                <DialogDescription>
                    Create a sign-in for a member of staff.
                </DialogDescription>
            </DialogHeader>
            <FormField
                label="Full name"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                required
            />
            <FormField
                label="Username"
                value={form.username}
                onChange={(e) => set("username")(e.target.value)}
                autoComplete="off"
                required
            />
            <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                required
            />
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="new-user-role"
                    className="text-sm font-medium">
                    Role
                </label>
                <select
                    id="new-user-role"
                    value={form.role}
                    onChange={(e) => set("role")(e.target.value)}
                    className="h-9 rounded-md border px-2 text-sm">
                    {ASSIGNABLE_ROLES.map((r) => (
                        <option
                            key={r}
                            value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>
            <FormField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
                hint={`At least ${MIN_PASSWORD} characters.`}
                autoComplete="new-password"
                required
            />
            <FormField
                label="Confirm password"
                type="password"
                value={form.confirm}
                onChange={(e) => set("confirm")(e.target.value)}
                error={fieldError}
                autoComplete="new-password"
                required
            />
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <DialogFooter>
                <button
                    type="button"
                    onClick={onClose}
                    className={buttonVariants({ variant: "outline" })}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={busy}
                    className={buttonVariants()}>
                    {busy ? "Creating…" : "Create user"}
                </button>
            </DialogFooter>
        </form>
    );
}

interface ResetProps {
    user: ManagedUser | null;
    onClose: () => void;
    onDone: (user: ManagedUser) => void;
}

/** Dialog form that sets a new password for `user`. */
export function ResetPasswordDialog({ user, onClose, onDone }: ResetProps) {
    return (
        <Dialog
            open={user !== null}
            onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                {user && (
                    <ResetPasswordForm
                        user={user}
                        onClose={onClose}
                        onDone={onDone}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function ResetPasswordForm({
    user,
    onClose,
    onDone,
}: ResetProps & { user: ManagedUser }) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [fieldError, setFieldError] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        const problem = passwordError(password, confirm);
        setFieldError(problem);
        setError("");
        if (problem) return;
        setBusy(true);
        try {
            await resetPassword(user.id, password);
            onDone(user);
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
            className="flex flex-col gap-3">
            <DialogHeader>
                <DialogTitle>Reset password</DialogTitle>
                <DialogDescription>
                    Set a new password for {user.name}.
                </DialogDescription>
            </DialogHeader>
            <FormField
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint={`At least ${MIN_PASSWORD} characters.`}
                autoComplete="new-password"
                required
            />
            <FormField
                label="Confirm new password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={fieldError}
                autoComplete="new-password"
                required
            />
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            <DialogFooter>
                <button
                    type="button"
                    onClick={onClose}
                    className={buttonVariants({ variant: "outline" })}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={busy}
                    className={buttonVariants()}>
                    {busy ? "Saving…" : "Set password"}
                </button>
            </DialogFooter>
        </form>
    );
}
