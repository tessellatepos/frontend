import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { getDeviceToken } from "@/utils/apiFetch.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

/**
 * Layout route that lets a request through when the user is signed in or this
 * browser holds a device token; otherwise sends it to /login?returnTo=<here>.
 */
export default function RequireAuth() {
    const status = useAuthStore((s) => s.status);
    const location = useLocation();

    if (getDeviceToken() || status === "signed-in") return <Outlet />;
    if (status === "unknown") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }
    const returnTo = encodeURIComponent(
        location.pathname + location.search + location.hash,
    );
    return (
        <Navigate
            to={`/login?returnTo=${returnTo}`}
            replace
        />
    );
}
