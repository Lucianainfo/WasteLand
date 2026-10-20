import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { localApiPlugin } from './vite-plugins/localApi.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The empty third argument also loads variables without the VITE_ prefix (from .env.local,
  // written by `npx vercel env pull`). The database credentials are copied into the Node
  // process for the local API only — they are never sent to the browser.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
  }
})
