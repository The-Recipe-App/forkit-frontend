import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["swiper"],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },

  preview: {
    // ✅ Allow external access via Railway domain during `vite preview`
    allowedHosts: ['forkit.up.railway.app'],
    // (Optional) bind preview to all interfaces if you're exposing it
    host: '0.0.0.0',
    // (Optional) set a specific port if Railway expects one
    // port: 4173,
  },

  define: {
    global: {},
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
    },
  },
})
