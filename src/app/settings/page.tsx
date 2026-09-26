import { useSettingsStore } from "@/stores/settings/useSettingsStore";
import Appearance from "@/app/settings/pages/appearance/page";
import Devices from "@/app/settings/pages/devices/page";
import SettingsHome from "@/app/settings/pages/general/page";
import {
    type ISettingsMenuBarProps,
    SettingsMenuBar,
} from "@/components/SettingsMenuBar/";
import { MonitorSmartphone, Paintbrush, Settings } from "lucide-react";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";

export default function Config() {
    const { view } = useSettingsStore();

    const settingsPage = () => {
        if (view == undefined || view == "general") return <SettingsHome />;
        // if (view == "appearance") return <Appearance />;
        if (view == "devices") return <Devices />;
    };

    const menuItems: ISettingsMenuBarProps[] = [
        {
            name: "General",
            page: <SettingsHome />,
            view: "general",
            icon: Settings,
        },
        {
            name: "Appearance",
            page: <Appearance />,
            view: "appearance",
            icon: Paintbrush,
        },
        {
            name: "Devices",
            page: <Devices />,
            view: "devices",
            icon: MonitorSmartphone,
        },
    ];

    return (
        <div className={`flex flex-col`}>
            <div className={`w-full h-full py-5`}>
                <span className={`pl-5 text-4xl`}>Settings</span>
            </div>
            <div className={`grid grid-cols-[2fr_7fr] w-full h-full`}>
                <div className={`flex w-full`}>
                    <SettingsMenuBar menuItems={menuItems} />
                </div>
                <div className="flex flex-col">
                    {settingsPage()}
                    <PluginHost mount={PluginUIMountPoint.SETTINGS_TAB} />
                </div>
            </div>
        </div>
    );
}
