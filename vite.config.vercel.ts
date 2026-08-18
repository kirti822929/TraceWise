import { defineConfig } from "@tanstack/react-start/config";
import vercel from "@tanstack/react-start-vercel";

// Vercel deployment config. Keeps the original vite.config.ts untouched
// so Lovable preview/local dev still works with the Lovable wrapper.
export default defineConfig({
  server: {
    preset: "vercel",
    compatibilityDate: "2025-02-13",
  },
  tsr: {
    appDirectory: "src",
  },
  vite: {
    plugins: [vercel()],
  },
});
