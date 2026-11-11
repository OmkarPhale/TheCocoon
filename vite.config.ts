import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(workspaceRoot, "games/a-little-light-home"),
  publicDir: resolve(workspaceRoot, "public"),
  build: {
    outDir: resolve(workspaceRoot, "dist"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
  server: {
    host: "127.0.0.1",
  },
  preview: {
    host: "127.0.0.1",
  },
});
