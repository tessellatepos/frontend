import { Navigate } from "react-router";
import {
    SIGNED_IN_HOME,
    inSetupWizard,
    useAuthStore,
} from "@/stores/auth/useAuthStore.ts";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";
import { getDeviceToken, getStoredDeviceId } from "@/utils/apiFetch.ts";
import { roleHasScope } from "@/utils/scopes.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

/** `/`: send the visitor where their identity says they belong. */
export default function Home() {
    const status = useAuthStore((s) => s.status);
    const setupNeeded = useAuthStore((s) => s.setupNeeded);
    const wizard = useAuthStore(inSetupWizard);
    const role = useAuthStore((s) => s.user?.role);
    const knownDeviceId = useSettingsStore((s) => s.deviceId);

    if (status === "unknown" || setupNeeded === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }
    if (wizard)
        return (
            <Navigate
                to="/setup"
                replace
            />
        );
    const deviceId = knownDeviceId || getStoredDeviceId();
    if (getDeviceToken() && deviceId) {
        return (
            <Navigate
                to={`/storefront/${deviceId}`}
                replace
            />
        );
    }
    if (status === "signed-in")
        return (
            <Navigate
                to={
                    roleHasScope(role, "dashboard:read")
                        ? SIGNED_IN_HOME
                        : "/settings"
                }
                replace
            />
        );
    return (
        <Navigate
            to="/login"
            replace
        />
    );
}
