import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: {
        name: 'IPSL 대학원 졸업생 모임',
        short_name: 'IPSL',
        description: 'IPSL 대학원 졸업생 모임 - 회칙 및 운영 관리',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#1e1b4b',
        theme_color: '#1e1b4b',
        lang: 'ko',
        categories: ['education', 'productivity'],
        icons: [
          { src: './icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: './icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-cache', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore'],
          vendor: ['react', 'react-dom', 'zustand', '@headlessui/react'],
          xlsx: ['xlsx'],
        },
      },
    },
  },
})
