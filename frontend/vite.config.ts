import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png'],
      manifest: {
        name: 'Vnoted — Capture. Organize. Retrieve.',
        short_name: 'Vnoted',
        description: 'A fast, minimal note-taking app for developers and knowledge workers.',
        theme_color: '#0D0D0F',
        background_color: '#0D0D0F',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // TanStack Query
          'vendor-query': ['@tanstack/react-query'],
          // Tiptap editor (largest chunk)
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-code-block-lowlight',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-underline',
            '@tiptap/extension-task-list',
            '@tiptap/extension-task-item',
            '@tiptap/extension-highlight',
            'lowlight',
          ],
          // UI utilities
          'vendor-ui': ['axios', 'zustand', 'date-fns', 'lucide-react'],
        },
      },
    },
  },
})
