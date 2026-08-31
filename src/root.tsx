import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Theme } from "@radix-ui/themes";
import { useWebSocketConnection } from "@/stores/websocket/useWebSocketStore.ts";

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
    return <Outlet />;
}
