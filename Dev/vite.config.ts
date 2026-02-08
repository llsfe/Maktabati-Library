import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { builtinModules } from "module";
import pkg from "./package.json" with { type: "json" };

const PORT = 5000;
const root = path.resolve(import.meta.dirname);
const clientRoot = path.resolve(root, "client");

export default defineConfig({
  base: "", // Critical for Electron: ensures assets use relative paths
  plugins: [
    react(),
    electron([
      {
        // Absolute path to the main process entry
        entry: path.resolve(root, "electron/main.ts"),
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: path.resolve(root, "dist-electron"),
            lib: {
              entry: [
                path.resolve(root, "electron/main.ts"),
                path.resolve(root, "electron/preload.ts"),
              ],
              formats: ["cjs"],
            },
            rollupOptions: {
              external: [
                "electron",
                ...builtinModules,
                ...builtinModules.map((m) => `node:${m}`),
                ...Object.keys(pkg.dependencies || {}),
                ...Object.keys(pkg.devDependencies || {}),
              ],
              output: {
                entryFileNames: "[name].cjs",
              },
            },
          },
          resolve: {
            alias: {
              "@": path.resolve(clientRoot, "src"),
              "@shared": path.resolve(root, "shared"),
              "@assets": path.resolve(root, "attached_assets"),
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(clientRoot, "src"),
      "@shared": path.resolve(root, "shared"),
      "@assets": path.resolve(root, "attached_assets"),
    },
  },
  root: clientRoot,
  server: {
    proxy: {
      "/api": `http://localhost:${PORT}`,
      "/books": `http://localhost:${PORT}`,
      "/attached_assets": `http://localhost:${PORT}`,
    },
  },
  build: {
    outDir: path.resolve(root, "dist"),
    emptyOutDir: true,
  },
});
