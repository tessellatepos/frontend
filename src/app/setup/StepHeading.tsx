import { useEffect, useRef } from "react";

/** Step title that takes focus when the step appears. */
export function StepHeading({ children }: { children: string }) {
    const ref = useRef<HTMLHeadingElement>(null);
    useEffect(() => ref.current?.focus(), []);
    return (
        <h2
            ref={ref}
            tabIndex={-1}
            className="text-2xl outline-none">
            {children}
        </h2>
    );
}

/** Error text announced to screen readers and focused so it is not missed. */
export function StepError({ children }: { children: string }) {
    const ref = useRef<HTMLParagraphElement>(null);
    useEffect(() => ref.current?.focus(), [children]);
    return (
        <p
            ref={ref}
            tabIndex={-1}
            role="alert"
            className="text-sm text-red-600 outline-none">
            {children}
        </p>
    );
}
