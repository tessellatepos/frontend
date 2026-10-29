import { type ComponentProps, type ReactNode, useId } from "react";
import { Input } from "@/components/ui/input.tsx";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id"> {
    label: string;
    /** Error text; marks the input invalid and is announced with it. */
    error?: string;
    /** Help text shown under the input and tied to it. */
    hint?: ReactNode;
}

/** A labelled input whose hint and error text are tied to it for a11y. */
export function FormField({ label, error, hint, ...props }: FormFieldProps) {
    const id = useId();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy =
        [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") ||
        undefined;

    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor={id}
                className="text-sm font-medium">
                {label}
            </label>
            <Input
                {...props}
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
            />
            {hint && (
                <p
                    id={hintId}
                    className="text-xs text-gray-500">
                    {hint}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
