import type { ApiDb, AnyRecord } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
module.exports = function (db: ApiDb) {
  const { serializeCountries } = require('../utils/country')
  const {normalizeMetaIdParam, resolveMetaId} = require('../utils/metaId')
  const {serializeExtList} = require('../utils/ext')
  // Create and Save a new FilterRow
  const create = async function (req: ApiRequest, res: ApiResponse) {
    try {
      const filterObj = {...req.body.filter}
      const val = filterObj.val
      const rowId = req.body.rowId || null
      const filterId = req.body.filterId

      if (filterObj.type == 'array' && filterObj.param !== 'country' && filterObj.param !== 'ext') {
        filterObj.val = null
      }
      if (filterObj.param == 'country' && val) {
        filterObj.val = serializeCountries(val)
      }
      if (filterObj.param == 'ext' && val) {
        filterObj.val = serializeExtList(val)
      }

      const allowedFields = ['param', 'type', 'cond', 'val', 'active', 'note', 'lock']
      const payload: AnyRecord = {}
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(filterObj, key)) {
          payload[key] = filterObj[key]
        }
      }

      if (payload.param != null) {
        payload.param = normalizeMetaIdParam(payload.param)
      }

      let filterRow

      if (rowId) {
        const existing = await db.FilterRow.findByPk(rowId)
        if (existing) {
          await existing.update(payload)
          filterRow = existing
        } else {
          filterRow = await db.FilterRow.create(payload)
        }
      } else {
        filterRow = await db.FilterRow.create(payload)
      }

      if (filterId) {
        await db.FilterRowsInSavedFilter.findOrCreate({
          where: {
            filterId,
            rowId: filterRow.id,
          },
          defaults: {
            filterId,
            rowId: filterRow.id,
          },
        })
      }

      if (filterObj.type == 'array' && filterObj.param !== 'country' && filterObj.param !== 'ext') {
        await db.TagsInFilterRow.destroy({
          where: {
            rowId: filterRow.id,
          },
        })

        if (filterObj.cond?.includes('null') === false && val !== undefined && val !== null && val !== '') {
          const metaId = resolveMetaId(filterRow.param)
          for (const tagId of val) {
            await db.TagsInFilterRow.findOrCreate({
              where: {
                tagId,
                rowId: filterRow.id,
                metaId: metaId ?? filterRow.param,
              },
            })
          }
        }
      }

      res.status(201).send(filterRow)
    } catch (err) {
      console.log(err)
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  };

  // Find a single FilterRow with an id
  const findOne = function (req: ApiRequest, res: ApiResponse) {
    db.FilterRow
      .findOne({
        where: {
          id: req.params.id
        }
      })
      .then((data) => {
        res.status(201).send(data)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Update a FilterRow by the id in the request
  const update = function (req: ApiRequest, res: ApiResponse) {
    db.FilterRow
      .update(req.body, {
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        res.sendStatus(201)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  // Delete a FilterRow with the specified id in the request
  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    db.FilterRow
      .destroy({
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        res.sendStatus(201)
      })
      .catch((err: unknown) => {
        res.status(500).send({
          message: apiErrorMessage(err) || "Some error occurred while performing query."
        })
      })
  };

  return {
    create,
    findOne,
    update,
    deleteOne
  }
}