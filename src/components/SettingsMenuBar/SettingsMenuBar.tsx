import { Link } from "react-router";
import type { ComponentType, JSX, SVGProps } from "react";
import { type SettingsView, settingsPath } from "@/app/settings/tabs.ts";
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
                {menuItems.map((item) => {
                    const Icon = item.icon as ComponentType<
                        SVGProps<SVGSVGElement>
                    >;
                    const active = activeView === item.view;
                    return (
                        <li key={item.name}>
                            <Link
                                to={settingsPath(item.view as SettingsView)}
                                aria-current={active ? "page" : undefined}
                                className={`flex-1 w-full p-4 text-left cursor-pointer hover:bg-blue-200 block ${active ? "font-semibold" : ""}`}>
                                <span className={`px-2`}>
                                    <Icon className={`inline-block`} />
                                </span>
                                <span className={`text-xl`}>{item.name}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
