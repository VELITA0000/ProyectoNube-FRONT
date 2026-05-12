import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // shadcn/ui generates several `interface FooProps extends BarProps {}`
      // placeholders to keep the extension point even when the component does
      // not add any props yet. They are intentional, leave them as warnings.
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
  {
    // tailwind.config.ts pulls in `tailwindcss-animate` via require() because
    // that is the convention every Tailwind plugin documents. Allow it only
    // for the config file.
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
