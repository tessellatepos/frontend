import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import eslint from "vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig({
    plugins: [reactRouter(), tailwindcss(), eslint()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/api": "http://localhost:3000",
            "/plugins": "http://localhost:3000",
        },
    },
});
