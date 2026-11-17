import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Finance Tracker',
        short_name: 'Finance',
        description: 'Log every expense in under 5 seconds.',
        theme_color: '#f3f6f1',
        background_color: '#f3f6f1',
        display: 'standalone',
        orientation: 'portrait',
        shortcuts: [
          { name: 'Add expense', short_name: 'Expense', description: 'Log an expense', url: './?action=add', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Add income', short_name: 'Income', description: 'Record income', url: './?action=income', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Dashboard', short_name: 'Dashboard', description: 'See your money', url: './?view=data', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
      },
    }),
  ],
})
