import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 👈 ensures Vercel serves relative paths (important)
  build: {
    outDir: 'dist', // Vercel automatically uses this folder
    sourcemap: false, // optional – makes builds faster
  },
  server: {
    port: 5173,
    open: true,
  },
})
