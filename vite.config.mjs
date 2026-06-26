import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12321',
        changeOrigin: true,
      },
    },

    // Middleware для обработки некорректных URL
    middleware: (req, res, next) => {
      try {
        // Декодируем URL перед обработкой
        const decodedUrl = decodeURI(req.url)
        req.url = decodedUrl
      } catch (error) {
        // Если URL некорректен, отправляем 400 ошибку
        res.statusCode = 400
        res.end('Invalid URL')
        return
      }
      next()
    }
  },
  base: './',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
  // Настройки для сборки
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vuetify')) {
            return 'vuetify-vendor'
          }
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules/vue-router/') ||
            id.includes('node_modules/pinia/')
          ) {
            return 'vue-vendor'
          }
        },
      },
    },
  },
})