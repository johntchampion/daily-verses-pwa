import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      // injectManifest so our own worker can handle `push`; see src/sw.ts.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Daily Verses',
        short_name: 'Daily Verses',
        description: 'Daily scripture memorization — three verses at a time.',
        theme_color: '#fff6ea',
        background_color: '#fff6ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // Icons and the webmanifest must be precached for offline launches.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      // Registers the worker under `vite dev` so push can be tested on localhost.
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  server: {
    // The API has no CORS, so dev serves it same-origin as production does.
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
})
