import { defineConfig as w, createServer as b, createLogger as k } from "vite";
import z from "@vitejs/plugin-react";
import r from "path";
import O from "vite-plugin-electron";
import F from "vite-plugin-electron-renderer";
import { builtinModules as m } from "module";
import L from "fs";
import x from "crypto";
const j = { "@google-cloud/storage": "^7.18.0", "@hookform/resolvers": "^3.10.0", "@jridgewell/trace-mapping": "^0.3.25", "@radix-ui/react-accordion": "^1.2.4", "@radix-ui/react-alert-dialog": "^1.1.7", "@radix-ui/react-aspect-ratio": "^1.1.3", "@radix-ui/react-avatar": "^1.1.4", "@radix-ui/react-checkbox": "^1.1.5", "@radix-ui/react-collapsible": "^1.1.4", "@radix-ui/react-context-menu": "^2.2.7", "@radix-ui/react-dialog": "^1.1.7", "@radix-ui/react-dropdown-menu": "^2.1.7", "@radix-ui/react-hover-card": "^1.1.7", "@radix-ui/react-label": "^2.1.3", "@radix-ui/react-menubar": "^1.1.7", "@radix-ui/react-navigation-menu": "^1.2.6", "@radix-ui/react-popover": "^1.1.7", "@radix-ui/react-progress": "^1.1.3", "@radix-ui/react-radio-group": "^1.2.4", "@radix-ui/react-scroll-area": "^1.2.4", "@radix-ui/react-select": "^2.1.7", "@radix-ui/react-separator": "^1.1.3", "@radix-ui/react-slider": "^1.2.4", "@radix-ui/react-slot": "^1.2.0", "@radix-ui/react-switch": "^1.1.4", "@radix-ui/react-tabs": "^1.1.4", "@radix-ui/react-toast": "^1.2.7", "@radix-ui/react-toggle": "^1.1.3", "@radix-ui/react-toggle-group": "^1.1.3", "@radix-ui/react-tooltip": "^1.2.0", "@tanstack/react-query": "^5.60.5", "@uppy/aws-s3": "^5.1.0", "@uppy/core": "^5.2.0", "@uppy/dashboard": "^5.1.0", "@uppy/react": "^5.1.1", "class-variance-authority": "^0.7.1", clsx: "^2.1.1", cmdk: "^1.1.1", "connect-pg-simple": "^10.0.0", "date-fns": "^3.6.0", "drizzle-orm": "^0.39.3", "drizzle-zod": "^0.7.0", "embla-carousel-react": "^8.6.0", express: "^5.0.1", "express-session": "^1.18.1", "framer-motion": "^11.18.2", "google-auth-library": "^10.5.0", "input-otp": "^1.4.2", "lucide-react": "^0.453.0", memorystore: "^1.6.7", "next-themes": "^0.4.6", passport: "^0.7.0", "passport-local": "^1.0.0", pg: "^8.16.3", react: "^18.3.1", "react-day-picker": "^8.10.1", "react-dom": "^18.3.1", "react-hook-form": "^7.55.0", "react-icons": "^5.4.0", "react-resizable-panels": "^2.1.7", recharts: "^2.15.2", "tailwind-merge": "^2.6.0", "tailwindcss-animate": "^1.0.7", "tw-animate-css": "^1.2.5", vaul: "^1.1.2", wouter: "^3.3.5", ws: "^8.18.0", zod: "^3.24.2", "zod-validation-error": "^3.4.0" }, S = { "@tailwindcss/typography": "^0.5.15", "@tailwindcss/vite": "^4.1.18", "@types/connect-pg-simple": "^7.0.3", "@types/express": "^5.0.0", "@types/express-session": "^1.18.0", "@types/node": "20.19.27", "@types/passport": "^1.0.16", "@types/passport-local": "^1.0.38", "@types/react": "^18.3.11", "@types/react-dom": "^18.3.1", "@types/ws": "^8.5.13", "@vitejs/plugin-react": "^4.7.0", autoprefixer: "^10.4.20", "drizzle-kit": "^0.31.8", electron: "^40.0.0", "electron-builder": "^26.4.0", "electron-packager": "^17.1.2", esbuild: "^0.25.0", postcss: "^8.4.47", rimraf: "^5.0.10", tailwindcss: "^3.4.17", tsx: "^4.20.5", typescript: "5.6.3", vite: "^7.3.0", "vite-plugin-electron": "^0.29.0", "vite-plugin-electron-renderer": "^0.14.6" }, g = {
  dependencies: j,
  devDependencies: S
}, t = r.resolve(import.meta.dirname), u = r.resolve(t, "client"), D = w({
  plugins: [
    z(),
    O([
      {
        // Absolute path to the main process entry
        entry: r.resolve(t, "electron/main.ts"),
        onstart(e) {
          e.startup();
        },
        vite: {
          build: {
            lib: {
              entry: r.resolve(t, "electron/main.ts"),
              formats: ["es"]
            },
            rollupOptions: {
              external: [
                "electron",
                ...m,
                ...m.map((e) => `node:${e}`),
                ...Object.keys(g.dependencies || {}),
                ...Object.keys(g.devDependencies || {})
              ],
              output: {
                entryFileNames: "[name].js"
              }
            }
          },
          resolve: {
            alias: {
              "@": r.resolve(u, "src"),
              "@shared": r.resolve(t, "shared"),
              "@assets": r.resolve(t, "attached_assets")
            }
          }
        }
      }
    ]),
    F()
  ],
  resolve: {
    alias: {
      "@": r.resolve(u, "src"),
      "@shared": r.resolve(t, "shared"),
      "@assets": r.resolve(t, "attached_assets")
    }
  },
  root: u,
  server: {
    proxy: {
      "/api": "http://localhost:5050"
    }
  },
  build: {
    outDir: r.resolve(t, "dist"),
    emptyOutDir: !0
  }
});
let I = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const T = 128;
let a, i, _ = (e) => {
  !a || a.length < e ? (a = Buffer.allocUnsafe(e * T), x.randomFillSync(a), i = 0) : i + e > a.length && (x.randomFillSync(a), i = 0), i += e;
}, C = (e = 21) => {
  _(e |= 0);
  let s = "";
  for (let o = i - e; o < i; o++)
    s += I[a[o] & 63];
  return s;
};
const v = k();
async function B(e, s) {
  const o = {
    middlewareMode: !0,
    hmr: { server: e, path: "/vite-hmr" },
    allowedHosts: !0
  }, l = await b({
    ...D,
    configFile: !1,
    customLogger: {
      ...v,
      error: (n, p) => {
        v.error(n, p);
      }
    },
    server: o,
    appType: "custom"
  });
  s.use(l.middlewares), s.use("/{*path}", async (n, p, f) => {
    const y = n.originalUrl;
    try {
      const c = r.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let d = await L.promises.readFile(c, "utf-8");
      d = d.replace(
        'src="/src/main.tsx"',
        `src="/src/main.tsx?v=${C()}"`
      );
      const h = await l.transformIndexHtml(y, d);
      p.status(200).set({ "Content-Type": "text/html" }).end(h);
    } catch (c) {
      l.ssrFixStacktrace(c), f(c);
    }
  });
}
export {
  B as setupVite
};
