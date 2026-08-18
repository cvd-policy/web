import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  build: {
    target: "es2022",
    // No hashed vendor CDN, no code split by route: one small bundle is enough.
    chunkSizeWarningLimit: 700,
  },
  server: { port: 5173 },
});
