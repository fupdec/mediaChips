import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

const {getAuthService} = require('../../app/server/authRegistry')
const {applyLanAccessChange, isLanAccessEnvLocked} = require('../../app/server/lanAccess')
const {createSettingsRepository} = require('../db/repositories/settings')

module.exports = function (db: ApiDb) {
  const settingsRepo = createSettingsRepository(db.drizzle)

  const findAll = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const authService = getAuthService()
      const data = settingsRepo.findAll()
      const settings = await authService.loadSecuritySettings()
      const sanitized = authService.sanitizeSettingRows(
        data,
        settings.passwordProtection,
        authService.isRequestAuthenticated(req),
      )
      res.status(201).send(sanitized)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const findOne = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const authService = getAuthService()
      const data = settingsRepo.findByOption(req.params.option)
      const settings = await authService.loadSecuritySettings()
      const sanitized = authService.sanitizeSettingRow(
        data,
        settings.passwordProtection,
        authService.isRequestAuthenticated(req),
      )
      res.status(201).send(sanitized)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  const update = async function (req: ApiRequest, res: ApiResponse) {
    if (!req.body) return res.sendStatus(400)

    try {
      settingsRepo.upsertByOption(req.params.option, req.body.value)

      if (req.params.option === 'phrase' || req.params.option === 'passwordProtection') {
        getAuthService().invalidateSettingsCache()
      }

      if (req.params.option === 'allowLanAccess') {
        if (isLanAccessEnvLocked()) {
          return res.status(409).send({
            message: 'LAN access is controlled by MEDIA_CHIPS_ALLOW_LAN environment variable',
          })
        }

        const enabled = req.body.value === '1' || req.body.value === 1 || req.body.value === true
        await applyLanAccessChange(enabled)
      }

      res.status(201).send([1])
    } catch (err) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    }
  };

  return {
    findAll,
    findOne,
    update,
  }
}
