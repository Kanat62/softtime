import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Третий аргумент "" — читать все переменные, а не только VITE_-префикс.
  // Нужно, потому что цель прокси используется в конфиге, а не в клиентском коде.
  const env = loadEnv(mode, process.cwd(), "");
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || "http://localhost:3000";

  return {
  plugins: [
    tanstackRouter({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // In dev, proxy /api/* to the backend so there are no CORS issues.
      // Target: VITE_DEV_PROXY_TARGET, defaults to the local NestJS instance.
      // Set it to the deployed backend when running the API remotely.
      // In production set VITE_API_URL to the real backend origin instead —
      // this proxy exists only in the dev server and is absent from the build.
      "/api": {
        target: devProxyTarget,
        changeOrigin: true,
      },
    },
  },
  };
});
