//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import js from "@eslint/js";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import globals from "globals";
import tseslint from "typescript-eslint";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import pluginReact from "eslint-plugin-react";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import html from "@html-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import reactHooks from "eslint-plugin-react-hooks";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import reactRefresh from "eslint-plugin-react-refresh";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import jsxA11y from "eslint-plugin-jsx-a11y";
//@ts-expect-error I'm not planning on fixing these imports, doesn't cause any issues when linting
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
    {
        files: ["**/*.{ts,mts,cts,tsx}"],
        plugins: {
            js,
            "@typescript-eslint": tseslint.plugin,
            pluginReact,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        settings: {
            react: { version: "detect" },
        },
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            pluginReact.configs.flat.recommended,
            jsxA11y.flatConfigs.recommended,
            eslintPluginPrettierRecommended,
        ],
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
            },
            globals: globals.browser,
        },
        rules: {
            ...reactRefresh.configs.vite.rules,
            ...reactHooks.configs.flat.recommended.rules,
            "react/react-in-jsx-scope": ["off"],
        },
    },
    {
        files: ["**/*.html"],
        plugins: { html },
        language: "html/html",
        extends: ["html/recommended"],
        rules: {
            "html/require-closing-tag": ["off"],
        },
    },
]);
