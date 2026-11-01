import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { meetsRole, roleHasScope } from "@/utils/scopes.ts";
import Catalog from "@/app/settings/pages/catalog/page.tsx";

/**
 * `/catalog`: a sidebar work area. Same gate as its sidebar entry (catalog
 * read scope, manager and up); anyone else is sent to Settings.
 */
export default function CatalogRoute() {
    const role = useAuthStore((s) => s.user?.role);
    if (!roleHasScope(role, "catalog:read") || !meetsRole(role, "manager")) {
        return (
            <Navigate
                to="/settings"
                replace
            />
        );
    }
    return <Catalog />;
}
