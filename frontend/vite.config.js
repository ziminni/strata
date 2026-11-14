import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // read .env (all keys, not only VITE_*) so server-side URLs/tokens can live there too
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // FastAPI backend (see ../backend)
        '/api': 'http://127.0.0.1:8000',
        // Field sensor device API (see src/hooks/useSensor.js). Proxied to avoid CORS on the devtunnel.
        '/sensor': {
          target: env.SENSOR_API_URL || 'https://h9173qw8-8080.usw2.devtunnels.ms',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/sensor/, ''),
          // Private devtunnel? set SENSOR_TUNNEL_TOKEN (from `devtunnel token <id> --scopes connect`)
          headers: env.SENSOR_TUNNEL_TOKEN ? { 'X-Tunnel-Authorization': `tunnel ${env.SENSOR_TUNNEL_TOKEN}` } : {},
        },
        // STRATA crop model (see src/lib/model.js). Proxied: it sends no CORS headers, and ngrok needs the skip header.
        '/model': {
          target: env.MODEL_BASE_URL || 'https://backlash-handlebar-scheme.ngrok-free.dev',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/model/, ''),
          headers: { 'ngrok-skip-browser-warning': '1' },
        },
      },
    },
  }
})
