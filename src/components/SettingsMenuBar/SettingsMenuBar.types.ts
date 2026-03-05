import type { SettingsView } from "@/stores/settings/useSettingsStore.ts";
import type { JSX } from "react";

export interface ISettingsMenuBarProps {
    name: string;
    page: JSX.Element;
    view: SettingsView | string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
