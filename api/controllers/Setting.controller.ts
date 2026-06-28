import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  // Find a single option with a name in the request
  const findAll = function (req: ApiRequest, res: ApiResponse) {
    db.Setting.findAll({
      raw: true
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Find a single option with a name in the request
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.Setting.findOne({
      where: {
        option: req.params.option
      },
      raw: true
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch((err: unknown) => {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a single option with a name and value in the request
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