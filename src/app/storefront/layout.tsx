import { CartProvider } from "@/utils/cart/CartProvider";
import { Outlet } from "react-router";

export default function StorefrontLayout() {
    return (
        <CartProvider>
            <Outlet />
        </CartProvider>
    );
}
