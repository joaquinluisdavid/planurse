import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: (() => {
    const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
    return process.env.GITHUB_ACTIONS === 'true' && repository && !repository.endsWith('.github.io')
      ? `/${repository}/`
      : '/'
  })(),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
