import { NavLink } from "react-router";
import type { ComponentType, SVGProps } from "react";
import { navItemClass } from "./navItemClass.ts";

interface NavItemProps {
    to: string;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    end?: boolean;
    /**
     * Set when the active state is not the URL's own, as for Settings tabs
     * that share one path. Omitted means the router decides.
     */
    active?: boolean;
}

export function NavItem({ to, label, icon: Icon, end, active }: NavItemProps) {
    return (
        <NavLink
            to={to}
            end={end}
            aria-current={
                active === undefined ? undefined : active ? "page" : false
            }
            className={({ isActive }) => navItemClass(active ?? isActive)}>
            <Icon className="size-5 shrink-0" />
            <span>{label}</span>
        </NavLink>
    );
}
