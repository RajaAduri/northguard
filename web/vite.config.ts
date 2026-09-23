import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server binds 0.0.0.0 so a second tester on the LAN can reach it. /api is
// proxied to the gateway (customer-side inspection), keeping the browser origin clean.
const GATEWAY = process.env.GATEWAY_URL ?? 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.WEB_HOST ?? '0.0.0.0',
    port: Number(process.env.WEB_PORT ?? 5173),
    proxy: { '/api': { target: GATEWAY, changeOrigin: true } },
    // The SPA imports the core's pure rehydration module (AF-307) from ../core; allow it.
    fs: { allow: ['..'] },
  },
})
// Test config lives in vitest.config.ts (unchanged); this file is the dev/build server only.
