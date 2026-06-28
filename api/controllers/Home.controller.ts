import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
const {getHomeMedia} = require('../services/homeMedia')
const {getRandomMarks} = require('../services/homeMarkers')
const {getHomeHealth} = require('../services/homeHealth')
const {getHomeExtendedStats} = require('../services/homeExtendedStats')

function parseLimit(value: unknown, fallback: number, max = 24) {
  return Math.min(Math.max(Number(value) || fallback, 1), max)
}

module.exports = (db: ApiDb) => {
  const getMedia = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const limits = {
        continue: parseLimit(req.query.continueLimit ?? req.query.limit, 12),
        favorites: parseLimit(req.query.favoritesLimit ?? req.query.limit, 12),
        topViews: parseLimit(req.query.topViewsLimit ?? req.query.limit, 12),
      }
      const data = await getHomeMedia(db, limits)
      res.status(200).send(data)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving home media.',
      })
    }
  }

  const getMarkers = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const limit = parseLimit(req.query.limit, 8, 16)
      const marks = await getRandomMarks(db, limit)
      res.status(200).send({marks})
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving home markers.',
      })
    }
  }

  const getHealth = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = await getHomeHealth(db)
      res.status(200).send(data)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving home health.',
      })
    }
  }

  const getExtendedStats = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = await getHomeExtendedStats(db)
      res.status(200).send(data)
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || 'Some error occurred while retrieving extended stats.',
      })
    }
  }

  return {
    getMedia,
    getMarkers,
    getHealth,
    getExtendedStats,
  }
}
