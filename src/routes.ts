//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import type { RouteConfig } from "@react-router/dev";
import { route } from "@react-router/dev/routes";

export default [
    route("settings", "app/settings/page.tsx"),
    route("*?", "app/storefront/page.tsx"),
] satisfies RouteConfig;
