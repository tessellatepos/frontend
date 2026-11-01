import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Theme } from "@radix-ui/themes";
import { useWebSocketConnection } from "@/stores/websocket/useWebSocketStore.ts";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { useEffect } from "react";
import { PluginLoader } from "@/plugin-host/PluginLoader.tsx";

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>My App</title>
                <Meta />
                <Links />
            </head>
            <body>
                <Theme>{children}</Theme>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function Root() {
    useWebSocketConnection();
    const refresh = useAuthStore((s) => s.refresh);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    return (
        <PluginLoader>
            <Outlet />
        </PluginLoader>
    );
}
