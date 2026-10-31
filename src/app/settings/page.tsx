import { Navigate, useSearchParams } from "react-router";
import Appearance from "@/app/settings/pages/appearance/page";
import Devices from "@/app/settings/pages/devices/page";
import SignInMethods from "@/app/settings/pages/sign-in/page";
import Users from "@/app/settings/pages/users/page";
import SettingsHome from "@/app/settings/pages/general/page";
import Providers from "@/app/settings/pages/providers/page";
import ApiCredentials from "@/app/settings/pages/api-credentials/page";
import Payments from "@/app/settings/pages/payments/page";
import Storefronts from "@/app/settings/pages/storefronts/page";
import { isSettingsView } from "@/app/settings/tabs.ts";
import {
    type ISettingsMenuBarProps,
    SettingsMenuBar,
} from "@/components/SettingsMenuBar/";
import {
    CreditCard,
    KeyRound,
    Globe,
    MonitorSmartphone,
    Paintbrush,
    Plug,
    Settings,
    Store,
    Users as UsersIcon,
} from "lucide-react";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { meetsRole } from "@/utils/scopes.ts";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";

export default function Config() {
    const [params] = useSearchParams();
    const user = useAuthStore((s) => s.user);
    const tab = params.get("tab");

    // Catalog is a sidebar work area now; old links to its tab still work.
    if (tab === "catalog")
        return (
            <Navigate
                to="/catalog"
                replace
            />
        );

    // The backend enforces every scope; these tabs are only hidden from roles
    // that could not use them. Administration only: Catalog is a sidebar page.
    const allMenuItems: ISettingsMenuBarProps[] = [
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
            name: "Storefronts",
            page: <Storefronts />,
            view: "storefronts",
            icon: Store,
            minRole: "manager",
        },
        {
            name: "Devices",
            page: <Devices />,
            view: "devices",
            icon: MonitorSmartphone,
            minRole: "owner",
        },
        {
            name: "Providers",
            page: <Providers />,
            view: "providers",
            icon: Plug,
            minRole: "owner",
        },
        {
            name: "Users",
            page: <Users />,
            view: "users",
            icon: UsersIcon,
            minRole: "owner",
        },
        {
            name: "Sign-in methods",
            page: <SignInMethods />,
            view: "sign-in",
            icon: KeyRound,
            minRole: "owner",
        },
        {
            name: "API credentials",
            page: <ApiCredentials />,
            view: "api-credentials",
            icon: Globe,
            minRole: "owner",
        },
        {
            name: "Payments",
            page: <Payments />,
            view: "payments",
            icon: CreditCard,
            minRole: "owner",
        },
    ];

    const menuItems = allMenuItems.filter((item) =>
        meetsRole(user?.role, item.minRole),
    );

    // An unknown or missing tab shows General. A restricted tab named in the
    // URL falls back to the first tab the role may see.
    const requested = isSettingsView(tab) ? tab : "general";
    const current =
        menuItems.find((item) => item.view === requested) ?? menuItems[0];

    return (
        <div className={`flex flex-col`}>
            <div
                className={`flex w-full items-center justify-between py-5 pr-5`}>
                <span className={`pl-5 text-4xl`}>Settings</span>
            </div>
            <div
                className={`grid grid-cols-[minmax(0,2fr)_minmax(0,7fr)] w-full h-full`}>
                <div className={`flex w-full`}>
                    <SettingsMenuBar
                        menuItems={menuItems}
                        activeView={current?.view}
                    />
                </div>
                <div className="flex flex-col min-w-0">
                    {current?.page}
                    <PluginHost mount={PluginUIMountPoint.SETTINGS_TAB} />
                </div>
            </div>
        </div>
    );
}
