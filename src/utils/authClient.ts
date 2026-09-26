import { useSettingsStore } from "@/stores/settings/useSettingsStore";
import { createAuthClient } from "better-auth/react";

const { backendUrl } = useSettingsStore.getState();

export const authClient = createAuthClient({
    baseURL: backendUrl,
});
