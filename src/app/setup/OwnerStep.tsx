import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { FormField } from "@/components/FormField.tsx";
import { StepError, StepHeading } from "./StepHeading.tsx";
import { commonError, postSetup } from "./api.ts";

export const MIN_PASSWORD_LENGTH = 8;

interface Props {
    token: string;
    /** Sends the user back to step 1 (bad token). */
    onBadToken: (message: string) => void;
}

/** Step 2: create the owner account. */
export function OwnerStep({ token, onBadToken }: Props) {
    const refresh = useAuthStore((s) => s.refresh);
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set =
        (key: keyof typeof form) => (e: { target: { value: string } }) =>
            setForm({ ...form, [key]: e.target.value });

    async function submit(event: FormEvent) {
        event.preventDefault();
        const errors: Record<string, string> = {};
        if (form.password.length < MIN_PASSWORD_LENGTH)
            errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
        if (form.password !== form.confirm)
            errors.confirm = "The passwords do not match.";
        setFieldErrors(errors);
        if (Object.keys(errors).length) {
            setError("Fix the highlighted fields.");
            return;
        }
        setBusy(true);
        setError("");
        const result = await postSetup("owner", {
            setupToken: token,
            name: form.name.trim(),
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
        });
        if (result.ok) {
            await refresh();
        } else if (result.status === 403) {
            onBadToken(
                "That setup token is not correct. Check the server log.",
            );
        } else if (result.status === 409) {
            // SETUP_COMPLETE / USER_EXISTS: someone already set this up.
            await refresh();
            void navigate("/", { replace: true });
        } else {
            setError(commonError(result));
        }
        setBusy(false);
    }

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => void submit(e)}
            noValidate>
            <StepHeading>Create the owner account</StepHeading>
            <FormField
                label="Full name"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                required
            />
            <FormField
                label="Username"
                value={form.username}
                onChange={set("username")}
                autoComplete="username"
                required
            />
            <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                required
            />
            <FormField
                label="Password"
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                error={fieldErrors.password}
                required
            />
            <FormField
                label="Confirm password"
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
                error={fieldErrors.confirm}
                required
            />
            {error && <StepError>{error}</StepError>}
            <button
                type="submit"
                disabled={busy}
                className="self-start rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                {busy ? "Creating…" : "Create owner"}
            </button>
        </form>
    );
}
