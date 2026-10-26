import { existsSync, statSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const vendoredBibliRoot = resolve(__dirname, './bibli')
const monorepoBibliRoot = resolve(__dirname, '../../bibli')
const nodeBibliRoot = resolve(__dirname, './node_modules/bibli')
const bibliAlias = existsSync(resolve(vendoredBibliRoot, 'shared/theme/theme.css'))
  ? vendoredBibliRoot
  : process.env.NUXT_BIBLI_LOCAL === '1' && existsSync(resolve(monorepoBibliRoot, 'package.json'))
    ? monorepoBibliRoot
    : nodeBibliRoot

const apiTarget = (process.env.NUXT_DEV_API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(/\/$/, '')
const useDevApiProxy = process.env.NODE_ENV !== 'production'
const appBase = process.env.NUXT_APP_BASE_URL || '/'
const basePath = appBase.endsWith('/') ? appBase : `${appBase}/`

function tryResolveBibli(base: string, path: string): string | null {
  const fullPath = resolve(base, path)
  if (existsSync(fullPath)) {
    try {
      if (statSync(fullPath).isDirectory()) {
        const indexPath = resolve(fullPath, 'index.ts')
        if (existsSync(indexPath)) return indexPath
        return fullPath
      }
    } catch {
      /* ignore */
    }
    return fullPath
  }
  for (const ext of ['/index.ts', '.ts', '/index.vue', '.vue', '.css']) {
    const withExt = fullPath + ext
    if (existsSync(withExt)) return withExt
  }
  return null
}

export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: appBase,
    buildAssetsDir: '_nuxt/',
    head: {
      title: 'Незалейка',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content' },
        { name: 'theme-color', content: '#f4f6f5' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Незалейка' },
      ],
      link: [
        { rel: 'icon', href: `${basePath}icons/leaf.svg`, type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: `${basePath}icons/apple-touch.png` },
        { rel: 'manifest', href: `${basePath}manifest.webmanifest` },
      ],
    },
  },
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.scss'],
  pinia: {
    storesDirs: ['./stores/**'],
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? (useDevApiProxy ? '' : apiTarget),
    },
  },
  alias: {
    bibli: bibliAlias,
    shared: resolve(bibliAlias, 'shared'),
    '@/shared': resolve(bibliAlias, 'shared'),
  },
  build: {
    transpile: ['bibli'],
  },
  vite: {
    optimizeDeps: { exclude: ['bibli'] },
    resolve: {
      dedupe: ['vue', 'vue-router'],
      alias: {
        bibli: bibliAlias,
        shared: resolve(bibliAlias, 'shared'),
        '@/shared': resolve(bibliAlias, 'shared'),
      },
    },
    server: {
      fs: { strict: false, allow: [__dirname, bibliAlias] },
      proxy: useDevApiProxy
        ? {
            '/api': { target: apiTarget, changeOrigin: true },
            '/media': { target: apiTarget, changeOrigin: true },
          }
        : undefined,
    },
    plugins: [
      {
        name: 'resolve-bibli-paths',
        enforce: 'pre',
        resolveId(id: string) {
          if (id === '@/shared/ui' || id.startsWith('@/shared/')) {
            const bibliPath = id.slice(2)
            const resolved = tryResolveBibli(bibliAlias, bibliPath)
            if (resolved) return { id: resolved, external: false }
          }
          if (id === 'shared/ui' || id.startsWith('shared/')) {
            const resolved = tryResolveBibli(bibliAlias, id)
            if (resolved) return { id: resolved, external: false }
          }
          if (!id.startsWith('bibli/')) return null
          const withoutPrefix = id.slice('bibli/'.length)
          const queryIndex = withoutPrefix.indexOf('?')
          const bibliPath = queryIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, queryIndex)
          const query = queryIndex === -1 ? '' : withoutPrefix.slice(queryIndex)
          const localResolved = tryResolveBibli(bibliAlias, bibliPath)
          if (localResolved) return { id: `${localResolved}${query}`, external: false }
          const nodeResolved = tryResolveBibli(nodeBibliRoot, bibliPath)
          if (nodeResolved) return { id: `${nodeResolved}${query}`, external: false }
          return null
        },
      },
    ],
  },
  pwa: {
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    injectRegister: 'auto',
    base: basePath,
    includeAssets: ['icons/**/*', 'push-sw.js', 'favicon.ico', 'robots.txt'],
    manifest: {
      name: 'Незалейка',
      short_name: 'Незалейка',
      description: 'Планировщик полива комнатных растений',
      lang: 'ru',
      theme_color: '#f4f6f5',
      background_color: '#f4f6f5',
      display: 'standalone',
      orientation: 'portrait',
      scope: basePath,
      start_url: basePath,
      id: basePath,
      icons: [
        { src: `${basePath}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${basePath}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
        {
          src: `${basePath}icons/icon-512-maskable.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      importScripts: [`${basePath}push-sw.js`],
      // Skip bibli login/background webps (multi‑MB); they load on demand.
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
      globIgnores: ['**/200.html', '**/404.html'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      // Must match a precached shell URL (see manifest: /nezaleika/ or index.html at base).
      navigateFallback: basePath,
      navigateFallbackDenylist: [/^\/api\//, /\/sw\.js$/, /\/workbox-.*\.js$/],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          // Content-addressed photo URLs never change.
          urlPattern: /^https:\/\/nezaleika-api\.onrender\.com\/api\/photos\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'plant-photos',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          urlPattern: /^https:\/\/nezaleika-api\.onrender\.com\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 8,
            expiration: { maxEntries: 64, maxAgeSeconds: 300 },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      // autoUpdate + pwa-update.client: needRefresh → activate + hard reload
      periodicSyncForUpdates: 60,
    },
  },
})
