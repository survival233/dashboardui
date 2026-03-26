import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      // Avoid stale JS/CSS during dev so UI matches source without hard refresh
      'Cache-Control': 'no-store',
    },
  },
})
