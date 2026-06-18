import { defineConfig } from 'vite'
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
  // Настройки для сборки
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify-vendor': ['vuetify', 'vuetify/styles']
        }
      }
    }
  },
})