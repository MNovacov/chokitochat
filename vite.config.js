// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // 👈 IMPORTANTE para producción en Vercel
  plugins: [react()],
  server: {
    port: 8000,
    strictPort: true
  }
})
