import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'

const {getAuthService} = require('../../app/server/authRegistry')
const {applyLanAccessChange, isLanAccessEnvLocked} = require('../../app/server/lanAccess')

module.exports = function (db: ApiDb) {
  const findAll = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const authService = getAuthService()
      const data = await db.Setting.findAll({raw: true})
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
      const data = await db.Setting.findOne({
        where: {
          option: req.params.option
        },
        raw: true
      })
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
      const [setting, created] = await db.Setting.findOrCreate({
        where: {
          option: req.params.option
        },
        defaults: {
          option: req.params.option,
          value: req.body.value
        },
      })

      if (!created) {
        await setting.update({value: req.body.value})
      }

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
