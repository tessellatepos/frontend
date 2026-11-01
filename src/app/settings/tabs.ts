/**
 * Tabs of the Settings page. Each one has its own URL, `/settings?tab=<view>`,
 * so the sidebar and dashboard can link straight to a tab.
 */
export const SETTINGS_VIEWS = [
    "general",
    "appearance",
    "storefronts",
    "devices",
    "providers",
    "users",
    "sign-in",
    "api-credentials",
] as const;

export type SettingsView = (typeof SETTINGS_VIEWS)[number];

export function isSettingsView(value: string | null): value is SettingsView {
    return SETTINGS_VIEWS.some((view) => view === value);
}

export function settingsPath(view: SettingsView): string {
    return `/settings?tab=${view}`;
}
