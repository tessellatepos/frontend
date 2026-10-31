/**
 * Classes shared by every item in the sidebar, the Settings menu and the
 * Catalog tabs, so they all hover and highlight the same way.
 */
export function navItemClass(active: boolean): string {
    return `flex items-center gap-3 px-4 py-3 hover:bg-blue-200 ${active ? "font-semibold" : ""}`;
}
