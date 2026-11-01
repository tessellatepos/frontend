import type { SettingsView } from "@/app/settings/tabs.ts";
import type { Role } from "@/stores/auth/useAuthStore.ts";
import type { JSX } from "react";

export interface ISettingsMenuBarProps {
    name: string;
    page: JSX.Element;
    view: SettingsView;
    /** Lowest role allowed to see this tab; omitted means everyone. */
    minRole?: Role;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
