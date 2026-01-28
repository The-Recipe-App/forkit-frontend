import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const serverUrl = env.VITE_SERVER_URL || "http://127.0.0.1:8000";

  return {
    plugins: [react()],

    optimizeDeps: {
      include: ["swiper"],
    },

    server: {
      host: "0.0.0.0",
      port: 5173,

      proxy: {
        "/api": {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },

        "/static": {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      allowedHosts: ["forkit.up.railway.app"],
      host: "0.0.0.0",
    },

    define: {
      global: {},
    },

    resolve: {
      alias: {
        crypto: "crypto-browserify",
        buffer: "buffer",
      },
    },
  };
});
