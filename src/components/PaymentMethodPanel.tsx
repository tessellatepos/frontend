import { apiFetch } from "@/utils/apiFetch.ts";
import { useEffect, useRef, useState } from "react";
import { Logger } from "tslog";
import type { Order } from "@tessellatepos/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { convertCentsToDollars, toBigIntAmount } from "@tessellatepos/sdk";
import type { PaymentMethod } from "@/stores/order/useOrdersStore.ts";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

const logger = new Logger();

const TERMINAL_POLL_INTERVAL_MS = 2000;

type Stage =
    | "select"
    | "cash"
    | "terminal-waiting"
    | "terminal-failed"
    | "mobile-waiting"
    | "mobile-failed";

type Props = {
    order: Order;
    onPaid: (
        order: Order,
        method: PaymentMethod,
        changeDueCents?: bigint | null,
    ) => void;
};

function jsonBody(body: unknown) {
    return JSON.stringify(body, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
    );
}

export default function PaymentMethodPanel({ order, onPaid }: Props) {
    const [stage, setStage] = useState<Stage>("select");
    const [amountTendered, setAmountTendered] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const deviceId = useSettingsStore((s) => s.deviceId);
    // A LOCAL till has no card hardware, so it offers cash only.
    const isLocalTill = useSettingsStore((s) => s.deviceType) === "LOCAL";

    const totalCents = toBigIntAmount(order.totalMoney?.amount);

    useEffect(() => {
        return () => {
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        };
    }, []);

    async function submitCashPayment() {
        setSubmitting(true);
        setErrorMessage("");
        try {
            const tenderedDollars = parseFloat(amountTendered);
            if (!Number.isFinite(tenderedDollars)) {
                setErrorMessage("Enter a valid amount");
                setSubmitting(false);
                return;
            }
            const tenderedCents = BigInt(Math.round(tenderedDollars * 100));

            const response = await apiFetch(
                `/api/v1/orders/${order.id}/pay-cash`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: jsonBody({ amountTendered: tenderedCents }),
                },
            );

            if (!response.ok) {
                setErrorMessage(
                    `Cash payment failed (status ${response.status})`,
                );
                setSubmitting(false);
                return;
            }

            // pay-cash answers { order, changeDue }
            const body: { order?: Order } = await response.json();
            const changeDueCents = tenderedCents - totalCents;
            onPaid(body.order ?? order, "CASH", changeDueCents);
        } catch (err) {
            logger.error("Cash payment failed", err);
            setErrorMessage("Cash payment failed — check backend logs");
            setSubmitting(false);
        }
    }

    async function pollTerminalStatus(checkoutId: string) {
        try {
            const response = await apiFetch(
                `/api/v1/orders/${order.id}/checkout/${checkoutId}`,
            );
            if (!response.ok) {
                throw new Error(`status endpoint returned ${response.status}`);
            }
            const body: { status?: string; order?: Order } =
                await response.json();

            if (body.status === "COMPLETED") {
                onPaid(body.order ?? order, "TERMINAL");
                return;
            }
            if (body.status === "CANCELED") {
                setStage("terminal-failed");
                setErrorMessage("Terminal checkout was canceled");
                return;
            }
            pollTimeoutRef.current = setTimeout(
                () => void pollTerminalStatus(checkoutId),
                TERMINAL_POLL_INTERVAL_MS,
            );
        } catch (err) {
            logger.error("Failed to poll terminal checkout status", err);
            setStage("terminal-failed");
            setErrorMessage("Lost contact with the Terminal — try again");
        }
    }

    async function startTerminalCheckout() {
        setStage("terminal-waiting");
        setErrorMessage("");
        try {
            const response = await apiFetch(
                `/api/v1/orders/${order.id}/checkout`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: jsonBody({ deviceId }),
                },
            );
            if (!response.ok) {
                setStage("terminal-failed");
                setErrorMessage(
                    `Could not start Terminal checkout (status ${response.status})`,
                );
                return;
            }
            const body: { checkoutId: string; status?: string; order?: Order } =
                await response.json();

            if (body.status === "COMPLETED") {
                onPaid(body.order ?? order, "TERMINAL");
                return;
            }
            await pollTerminalStatus(body.checkoutId);
        } catch (err) {
            logger.error("Failed to start terminal checkout", err);
            setStage("terminal-failed");
            setErrorMessage("Could not reach the Terminal device");
        }
    }

    // Listen for PAYMENT_RESULT from the mobile app's WebView bridge after
    // it completes a card charge on the Square Reader. The mobile app posts
    // the result back via ReactNativeWebView.postMessage (see HandlePayment.tsx).
    useEffect(() => {
        if (stage !== "mobile-waiting") return;

        async function confirmMobileReaderPayment(paymentId: string) {
            try {
                const response = await apiFetch(
                    `/api/v1/orders/${order.id}/pay-mobile-reader`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: jsonBody({ paymentId, deviceId }),
                    },
                );
                if (!response.ok) {
                    setStage("mobile-failed");
                    setErrorMessage(
                        `Could not confirm reader payment (status ${response.status})`,
                    );
                    return;
                }
                const paidOrder: Order = await response.json();
                onPaid(paidOrder ?? order, "MOBILE_READER");
            } catch (err) {
                logger.error("Failed to confirm mobile reader payment", err);
                setStage("mobile-failed");
                setErrorMessage("Could not confirm reader payment");
            }
        }

        function handleBridgeMessage(event: MessageEvent) {
            // Only accept messages from the same origin (WebView bridge)
            if (event.origin !== window.location.origin) return;

            let data: { type?: string; paymentId?: string; reason?: string };
            try {
                data =
                    typeof event.data === "string"
                        ? JSON.parse(event.data)
                        : event.data;
            } catch {
                return;
            }
            if (data.type === "PAYMENT_RESULT" && data.paymentId) {
                void confirmMobileReaderPayment(data.paymentId);
            } else if (data.type === "PAYMENT_FAILED") {
                setStage("mobile-failed");
                setErrorMessage(data.reason ?? "Reader payment failed");
            }
        }

        // React Native WebView delivers messages via `window` on iOS and via
        // `document` on Android — listen on both per the WebView bridge protocol.
        window.addEventListener("message", handleBridgeMessage);
        document.addEventListener(
            "message",
            handleBridgeMessage as EventListener,
        );
        return () => {
            window.removeEventListener("message", handleBridgeMessage);
            document.removeEventListener(
                "message",
                handleBridgeMessage as EventListener,
            );
        };
    }, [stage, order, onPaid, deviceId]);

    function startMobileReaderPayment() {
        setStage("mobile-waiting");
        setErrorMessage("");
        const bridge = (
            window as unknown as {
                ReactNativeWebView?: { postMessage: (msg: string) => void };
            }
        ).ReactNativeWebView;
        if (!bridge) {
            setStage("mobile-failed");
            setErrorMessage(
                "Mobile reader bridge not available (not running inside the POS WebView)",
            );
            return;
        }
        bridge.postMessage(
            JSON.stringify({
                type: "START_PAYMENT",
                orderId: order.id,
                amount: totalCents.toString(),
            }),
        );
    }

    if (stage === "select") {
        return (
            <div className="flex flex-col gap-2">
                <p className="font-medium">Select payment method</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={() => setStage("cash")}>Cash</Button>
                    {!isLocalTill && (
                        <>
                            <Button
                                onClick={() => void startTerminalCheckout()}>
                                Card — Terminal
                            </Button>
                            <Button onClick={() => startMobileReaderPayment()}>
                                Card — Mobile Reader
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (stage === "cash") {
        const parsedTendered = parseFloat(amountTendered);
        const tenderedCents = Number.isFinite(parsedTendered)
            ? BigInt(Math.round(parsedTendered * 100))
            : null;
        const changeCents =
            tenderedCents !== null ? tenderedCents - totalCents : null;

        return (
            <Dialog
                open
                onOpenChange={(open) => !open && setStage("select")}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cash payment</DialogTitle>
                        <DialogDescription>
                            Total due: ${convertCentsToDollars(totalCents)}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount tendered"
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                    />
                    {changeCents !== null && changeCents >= 0n && (
                        <p>Change due: ${convertCentsToDollars(changeCents)}</p>
                    )}
                    {errorMessage && (
                        <p className="text-destructive text-sm">
                            {errorMessage}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setStage("select")}
                            disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void submitCashPayment()}
                            disabled={
                                submitting ||
                                tenderedCents === null ||
                                tenderedCents < totalCents
                            }>
                            {submitting ? <Spinner /> : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (stage === "terminal-waiting") {
        return (
            <div className="flex flex-col items-center gap-2">
                <Spinner />
                <p>Waiting for Terminal…</p>
            </div>
        );
    }

    if (stage === "mobile-waiting") {
        return (
            <div className="flex flex-col items-center gap-2">
                <Spinner />
                <p>Waiting for Mobile Reader…</p>
            </div>
        );
    }

    // terminal-failed / mobile-failed
    return (
        <div className="flex flex-col gap-2">
            <p className="text-destructive text-sm">{errorMessage}</p>
            <Button onClick={() => setStage("select")}>Try again</Button>
        </div>
    );
}
