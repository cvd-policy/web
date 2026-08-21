import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  build: {
    target: "es2022",
    // No hashed vendor CDN, no code split by route: one small bundle is enough.
    chunkSizeWarningLimit: 700,
  },
  server: { port: 5173 },
  test: {
    // The pure parts of the site: the ones that turn a document into something
    // a user publishes, where a mistake is a mistake on someone else's domain.
    include: ["test/**/*.test.ts"],
    // Node has btoa, Blob, CompressionStream and TextEncoder, so nothing here
    // needs a simulated DOM.
    environment: "node",
  },
});
