const path = require('path')
const fs = require('fs')
const history = require('connect-history-api-fallback')
const express = require('express')
const {normalizeApiPath} = require('../../api/utils/normalizeApiPath')
const {createCorsMiddleware} = require('./constants')

function createExpressApp() {
  const app = express()
  const router = express.Router()

  app.use(createCorsMiddleware())

  app.use(express.json({
    limit: '100mb',
  }))

  app.use(express.urlencoded({extended: true}))

  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      const normalized = normalizeApiPath(req.url)
      if (normalized !== req.url) {
        req.url = normalized
      }
    }
    next()
  })

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${req.headers.origin || 'no origin'}`)
    next()
  })

  app.use(router)

  return {app, router}
}

function setupStaticApp(app) {
  const src = path.join(__dirname, '../../dist')
  const spaHistory = history({
    disableDotRule: true,
    verbose: false,
    rewrites: [
      {
        from: /^\/api\/.*$/,
        to(context) {
          return context.parsedUrl.pathname
        },
      },
      {
        from: /^\/socket\.io\/.*$/,
        to(context) {
          return context.parsedUrl.pathname
        },
      },
    ],
  })

  app.use(express.static(src))
  app.use(spaHistory)
}

module.exports = {
  createExpressApp,
  setupStaticApp,
}
