//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import type { RouteConfig } from "@react-router/dev";
import { layout, route } from "@react-router/dev/routes";

export default [
    route("settings", "app/settings/page.tsx"),
    layout("app/storefront/layout.tsx", [
        route("storefront/:deviceId", "app/storefront/page.tsx"),
        route("storefront/cart", "app/storefront/cart/page.tsx"),
    ]),
    route("*?", "app/getting-started/page.tsx"),
] satisfies RouteConfig;
