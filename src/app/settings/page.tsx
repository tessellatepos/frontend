import { useSettingsStore } from "@/stores/settings/useSettingsStore";
import Appearance from "@/app/settings/pages/appearance/page";
import Devices from "@/app/settings/pages/devices/page";
import SignInMethods from "@/app/settings/pages/sign-in/page";
import Users from "@/app/settings/pages/users/page";
import SettingsHome from "@/app/settings/pages/general/page";
import Providers from "@/app/settings/pages/providers/page";
import Storefronts from "@/app/settings/pages/storefronts/page";
import {
    type ISettingsMenuBarProps,
    SettingsMenuBar,
} from "@/components/SettingsMenuBar/";
import {
    KeyRound,
    MonitorSmartphone,
    Paintbrush,
    Plug,
    Settings,
    Store,
    Users as UsersIcon,
} from "lucide-react";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { type Role, useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { useNavigate } from "react-router";
import { PluginHost } from "@/plugin-host/PluginHost.tsx";

/** Higher rank can open everything a lower rank can. */
const ROLE_RANK: Record<Role, number> = {
    viewer: 0,
    cashier: 1,
    manager: 2,
    owner: 3,
};

/** Whether the signed-in role meets a tab's minimum; no role meets none. */
function meetsRole(role: Role | null | undefined, minRole?: Role): boolean {
    if (!minRole) return true;
    if (!role) return false;
    return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export default function Config() {
    const { view } = useSettingsStore();
    const user = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);
    const signOutError = useAuthStore((s) => s.signOutError);
    const navigate = useNavigate();

    // The backend enforces every scope; these tabs are only hidden from roles
    // that could not use them.
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
    ];

    const menuItems = allMenuItems.filter((item) =>
        meetsRole(user?.role, item.minRole),
    );

    // Resolving the page from the filtered list also blocks a restricted view
    // that is still selected after the role changes.
    const current = menuItems.find((item) => item.view === view);
    const settingsPage = current ? current.page : menuItems[0]?.page;

    return (
        <div className={`flex flex-col`}>
            <div
                className={`flex w-full items-center justify-between py-5 pr-5`}>
                <span className={`pl-5 text-4xl`}>Settings</span>
                {user && (
                    <div className={`flex items-center gap-3`}>
                        <span className={`text-sm text-gray-500`}>
                            {user.name}
                        </span>
                        <button
                            className={`rounded border px-3 py-1`}
                            onClick={() =>
                                void signOut().then((done) => {
                                    if (done)
                                        void navigate("/login", {
                                            replace: true,
                                        });
                                })
                            }>
                            Sign out
                        </button>
                        {signOutError && (
                            <span
                                role="alert"
                                className={`text-sm text-red-600`}>
                                {signOutError}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className={`grid grid-cols-[2fr_7fr] w-full h-full`}>
                <div className={`flex w-full`}>
                    <SettingsMenuBar menuItems={menuItems} />
                </div>
                <div className="flex flex-col">
                    {settingsPage}
                    <PluginHost mount={PluginUIMountPoint.SETTINGS_TAB} />
                </div>
            </div>
        </div>
    );
}
