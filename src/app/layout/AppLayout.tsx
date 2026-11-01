import { Navigate, NavLink, Outlet, useNavigate } from "react-router";
import { PluginUIMountPoint } from "@tessellatepos/plugin-sdk";
import { Puzzle } from "lucide-react";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { usePluginStore } from "@/stores/plugins/pluginStore.ts";
import { meetsRole, roleHasScope } from "@/utils/scopes.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { NAV_ENTRIES } from "./nav.ts";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 hover:bg-blue-200 ${isActive ? "font-semibold" : ""}`;

/**
 * Shell for the admin side: navigation filtered by what the signed-in role
 * may use, then the page. A browser that only holds a device token has no
 * business here and is sent back to `/`, which finds its till.
 */
export default function AppLayout() {
    const status = useAuthStore((s) => s.status);
    const user = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);
    const signOutError = useAuthStore((s) => s.signOutError);
    const uiMounts = usePluginStore((s) => s.uiMounts);
    const navigate = useNavigate();

    if (status === "unknown") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }
    if (status !== "signed-in") {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    const role = user?.role;
    const entries = NAV_ENTRIES.filter(
        (e) =>
            (!e.scope || roleHasScope(role, e.scope)) &&
            meetsRole(role, e.minRole),
    );
    const pluginPages = Object.entries(uiMounts)
        .filter(([, mounts]) =>
            mounts.some((m) => m.mount === PluginUIMountPoint.PAGE),
        )
        .map(([name]) => name);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_1fr]">
            <nav
                aria-label="Main"
                className="flex flex-col justify-between border-r">
                <ul>
                    {entries.map((e) => {
                        const Icon = e.icon;
                        return (
                            <li key={e.name}>
                                <NavLink
                                    to={e.to}
                                    end
                                    className={linkClass}>
                                    <Icon className="size-5" />
                                    <span>{e.name}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                    {pluginPages.map((name) => (
                        <li key={name}>
                            <NavLink
                                to={`/plugins/${name}`}
                                className={linkClass}>
                                <Puzzle className="size-5" />
                                <span>{name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-col gap-2 p-4 text-sm">
                    <span className="text-gray-500">{user?.name}</span>
                    <button
                        className="rounded border px-3 py-1"
                        onClick={() =>
                            void signOut().then((done) => {
                                if (done)
                                    void navigate("/login", { replace: true });
                            })
                        }>
                        Sign out
                    </button>
                    {signOutError && (
                        <span
                            role="alert"
                            className="text-red-600">
                            {signOutError}
                        </span>
                    )}
                </div>
            </nav>
            <main>
                <Outlet />
            </main>
        </div>
    );
}
