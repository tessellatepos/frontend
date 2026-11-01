import type { JSX } from "react";
import { settingsPath } from "@/app/settings/tabs.ts";
import { NavItem } from "@/components/NavItem.tsx";
import type { ISettingsMenuBarProps } from "./SettingsMenuBar.types";

type Props = {
    menuItems: ISettingsMenuBarProps[];
    /** The tab being shown; each tab is a link so it can be bookmarked. */
    activeView?: string;
};
export default function SettingsMenuBar({
    menuItems,
    activeView,
}: Props): JSX.Element {
    return (
        <div className="flex-1 w-full min-h-screen">
            <ul>
                {menuItems.map((item) => (
                    <li key={item.name}>
                        <NavItem
                            to={settingsPath(item.view)}
                            label={item.name}
                            icon={item.icon}
                            active={activeView === item.view}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
