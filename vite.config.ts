import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import eslint from "vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [["babel-plugin-react-compiler"]],
            },
        }),
        tailwindcss(),
        eslint(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            // fs: "rollup-plugin-node-polyfills/polyfills/empty",
            // path: "rollup-plugin-node-polyfills/polyfills/path",
            // dgram: "rollup-plugin-node-polyfills/polyfills/empty",
        },
    },
    optimizeDeps: {
        // exclude: ["@origranot/ts-logger"],
    },
});
