// AUTO-MANAGED baseline ESLint flat config (created only when none exists).
// Minimal + JSX-aware so the quality gate lints React code correctly. Replace
// with a richer project-specific config as needed.
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  {
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "*.config.*",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    plugins: { react },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    rules: {
      // Count JSX usage so components used only as <Comp/> aren't flagged unused,
      // and `import React` isn't flagged unused in classic-runtime files.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
    },
  },
];
