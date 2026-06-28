import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// On GitHub Pages the site is served from /troxos/, so the production build
// needs that base path. Local dev stays at root ('/').
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/troxos/' : '/',
  plugins: [react()],
}))
