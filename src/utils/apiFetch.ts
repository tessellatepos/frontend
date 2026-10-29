import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

/** localStorage key holding a paired device's token (prefix `tsd_`). */
export const DEVICE_TOKEN_KEY = "tessellate.deviceToken";
/** localStorage key remembering which device this browser is a till for. */
export const DEVICE_ID_KEY = "tessellate.deviceId";

/** Endpoints whose 401 means "wrong credentials", not "session lost". */
const SESSION_EXEMPT = ["/api/v1/setup/status", "/api/v1/auth/"];

let sessionLostHandler: (() => void) | undefined;

/**
 * Registers what happens when an internal API call is rejected with 401.
 * The auth store registers itself here so this module never imports it.
 */
export function onSessionLost(handler: () => void): void {
    sessionLostHandler = handler;
}

function readStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string | null): void {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode, blocked site data).
    }
}

/** The stored device token, or null when this browser is not a paired till. */
export function getDeviceToken(): string | null {
    return readStorage(DEVICE_TOKEN_KEY) || null;
}

/** Stores (or with null, clears) the device token. */
export function setDeviceToken(token: string | null): void {
    writeStorage(DEVICE_TOKEN_KEY, token);
}

/** The device id this browser last served as a storefront, if any. */
export function getStoredDeviceId(): string | null {
    return readStorage(DEVICE_ID_KEY) || null;
}

/** Remembers the device id so `/` can send a token holder back to its till. */
export function setStoredDeviceId(deviceId: string | null): void {
    writeStorage(DEVICE_ID_KEY, deviceId);
}

/**
 * fetch for backend calls. `path` starts with "/" and is prefixed with the
 * configured backend URL (empty = same-origin). Sends cookies, adds the
 * device token as a Bearer header when one is stored, and on 401 from an
 * internal call (except setup status and auth endpoints) runs the session-lost
 * handler. The response is returned unchanged either way.
 */
export async function apiFetch(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    const { backendUrl } = useSettingsStore.getState();
    const headers = new Headers(init.headers);
    const token = getDeviceToken();
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${backendUrl}${path}`, {
        ...init,
        headers,
        credentials: "include",
    });

    if (
        response.status === 401 &&
        !SESSION_EXEMPT.some((prefix) => path.startsWith(prefix))
    ) {
        // A rejected device token is dead; drop it so the guard stops
        // trusting it.
        if (token) setDeviceToken(null);
        sessionLostHandler?.();
    }
    return response;
}
