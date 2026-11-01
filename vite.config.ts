import { defineConfig } from "vite";
import path from "path";
import { readFileSync } from "fs";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import eslint from "vite-plugin-eslint";

// Backend the dev server proxies to; override to target a backend on another port.
const backend = process.env.VITE_BACKEND_PROXY ?? "http://localhost:3000";

// Shown on the Settings General tab.
const { version } = JSON.parse(
    readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
) as { version: string };

// https://vite.dev/config/
export default defineConfig({
    plugins: [reactRouter(), tailwindcss(), eslint()],
    define: {
        __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/api": backend,
            // Only a plugin's own routes and assets (/plugins/<name>/...);
            // /plugins/<name> itself is the frontend's plugin page.
            "^/plugins/[^/]+/.+": backend,
            "/auth": backend,
            "/gateway": backend,
            "/webhooks": backend,
            "/ws": { target: backend, ws: true },
        },
    },
});
