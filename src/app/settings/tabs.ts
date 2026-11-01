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
    "payments",
] as const;

export type SettingsView = (typeof SETTINGS_VIEWS)[number];

export function isSettingsView(value: string | null): value is SettingsView {
    return SETTINGS_VIEWS.some((view) => view === value);
}

/** Plugin SETTINGS_TAB registrations get a `plugin:<key>` view. */
export const PLUGIN_VIEW_PREFIX = "plugin:";

export function settingsPath(view: string): string {
    return `/settings?tab=${encodeURIComponent(view)}`;
}
