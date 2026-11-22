import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'"

/**
 * Injects a strict CSP <meta> tag into the built index.html only (not in
 * dev), since Vite's dev server relies on an inline HMR preamble script
 * that a strict script-src would block.
 */
function injectCspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
    },
  }
}

// Kept as plain literals (not imported from src/config/appConfig.ts) because
// vite.config.ts compiles under a separate tsconfig (Node/nodenext module
// resolution) from the app code. Keep these in sync with APP_CONFIG.
const APP_NAME = 'Thagaval Thunai'
const APP_NAME_TA = 'தகவல் துணை'
const TAGLINE_EN = 'Find government schemes you may be eligible for'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    injectCspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: `${APP_NAME} / ${APP_NAME_TA}`,
        short_name: APP_NAME_TA,
        description: TAGLINE_EN,
        start_url: '/',
        display: 'standalone',
        background_color: '#fdfcf9',
        theme_color: '#0b5d3b',
        lang: 'ta',
        dir: 'ltr',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the app needs (HTML/JS/CSS/scheme data) is bundled at build
        // time and precached, so the app works fully offline after first load.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
