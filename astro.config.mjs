import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://joshuasoong.studio',
  vite: {
    server: {
      allowedHosts: ['.dolphin-alioth.ts.net'],
    },
  },
})
