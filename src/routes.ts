//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import type { RouteConfig } from "@react-router/dev";
import { index, layout, route } from "@react-router/dev/routes";

export default [
    index("app/home/page.tsx"),
    route("setup", "app/setup/page.tsx"),
    route("login", "app/login/page.tsx"),
    layout("app/require-auth.tsx", [
        route("settings", "app/settings/page.tsx"),
        layout("app/storefront/layout.tsx", [
            route("storefront/:deviceId", "app/storefront/page.tsx"),
            route("storefront/cart", "app/storefront/cart/page.tsx"),
            route("storefront/receipt", "app/storefront/receipt/page.tsx"),
        ]),
        route("plugins/:pluginName", "app/plugin-page.tsx"),
    ]),
    route("*?", "app/getting-started/page.tsx"),
] satisfies RouteConfig;
