import { useSettingsStore } from "@/stores/settings/useSettingsStore";
import { createAuthClient } from "better-auth/react";
import { adminClient, usernameClient } from "better-auth/client/plugins";

const { backendUrl } = useSettingsStore.getState();

export const authClient = createAuthClient({
    baseURL: backendUrl || undefined,
    basePath: "/api/v1/auth",
    plugins: [usernameClient(), adminClient()],
    fetchOptions: { credentials: "include" },
});
