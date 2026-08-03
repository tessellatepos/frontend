import {
    type SettingsView,
    useSettingsStore,
} from "@/stores/settings/useSettingsStore";
import type { ComponentType, JSX, SVGProps } from "react";
import type { ISettingsMenuBarProps } from "./SettingsMenuBar.types";

type Props = {
    menuItems: ISettingsMenuBarProps[];
};
export default function SettingsMenuBar({ menuItems }: Props): JSX.Element {
    const { view, setView } = useSettingsStore();

    return (
        <div className="flex-1 w-full min-h-screen">
            <ul>
                {menuItems.map((item) => {
                    const Icon = item.icon as ComponentType<
                        SVGProps<SVGSVGElement>
                    >;
                    return (
                        <li key={item.name}>
                            <div
                                className={
                                    view == item.view ? "font-semibold" : ""
                                }
                                key={item.view}>
                                <button
                                    tabIndex={0}
                                    onClick={() =>
                                        setView(item.view as SettingsView)
                                    }
                                    onKeyDown={() =>
                                        setView(item.view as SettingsView)
                                    }
                                    className={`flex-1 w-full p-4 text-left cursor-pointer hover:bg-blue-200`}>
                                    <span className={`px-2`}>
                                        <Icon className={`inline-block`} />
                                    </span>
                                    <span className={`text-xl`}>
                                        {item.name}
                                    </span>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
