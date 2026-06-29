import type { ApiDb } from '../types/db'
import { apiErrorMessage, paramString } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

import { createSettingsRepository } from '../db/repositories/settings'
import { getAuthService } from '../../app/server/authRegistry'
import { applyLanAccessChange, isLanAccessEnvLocked } from '../../app/server/lanAccess'

export default function (db: ApiDb) {
  const settingsRepo = createSettingsRepository(db.drizzle)

  const findAll = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const authService = getAuthService()
      const data = settingsRepo.findAll()
      const settings = await authService.loadSecuritySettings()
      const sanitized = authService.sanitizeSettingRows(
        data as Parameters<typeof authService.sanitizeSettingRows>[0],
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
      const data = settingsRepo.findByOption(paramString(req.params.option))
      const settings = await authService.loadSecuritySettings()
      const sanitized = authService.sanitizeSettingRow(
        (data ?? null) as Parameters<typeof authService.sanitizeSettingRow>[0],
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
      settingsRepo.upsertByOption(paramString(req.params.option), req.body.value)

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
