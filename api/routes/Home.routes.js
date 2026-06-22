module.exports = (app, db) => {
  const Home = require('../controllers/Home.controller')(db)
  const router = require('express').Router()

  router.get('/media', Home.getMedia)
  router.get('/markers', Home.getMarkers)
  router.get('/health', Home.getHealth)
  router.get('/extended-stats', Home.getExtendedStats)

  app.use('/api/home', router)
}
