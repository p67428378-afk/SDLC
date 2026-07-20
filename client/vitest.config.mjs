// AUTO-MANAGED by the Frontend Developer Agent — guarantees a deterministic,
// Windows-safe test harness (jsdom + globals + setup file). Do not rely on
// editing this for app config; vite.config.js still governs build/dev.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [fileURLToPath(new URL("./src/setup.js", import.meta.url))],
  },
});
