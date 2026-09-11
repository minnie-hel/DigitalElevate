import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// EMFILE ("too many open files") on Linux: raise limit before dev, e.g.
//   ulimit -n 65536 && npm run dev
// or use npm run dev:safe (see package.json).
const usePolling = process.env.VITE_USE_POLLING === '1'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.vite/**'],
      ...(usePolling ? { usePolling: true, interval: 1000 } : {}),
    },
  },
})
