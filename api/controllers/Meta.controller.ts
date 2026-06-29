import type { ApiDb } from '../types/db'
import { apiErrorMessage } from '../types/errors'
import type { ApiRequest, ApiResponse } from '../types/http'
import { getRequestBody } from '../types/http'
import type { Meta, MetaWritePayload } from '@shared/entities/meta'
import { paramString } from '../types/errors'
const fs = require("fs")
const path = require('path')

const {createMetaRepository} = require('../db/repositories/meta')

module.exports = function (db: ApiDb) {
  const metaRepo = createMetaRepository(db.drizzle)
  const metaFolder = path.join(db.path, 'meta')

  const create = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<MetaWritePayload>(req)
      const data = metaRepo.create(body as Record<string, unknown>)

      if (data.type === 'array') {
        const dir = path.join(metaFolder, String(data.id))
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
        metaRepo.ensureArrayMetaResources(data.id)
      }

      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  const findAll = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = metaRepo.findAll()
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  const findOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = metaRepo.findById(Number(req.params.id)) ?? null
      res.status(201).send(data as Meta | null)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  const findLatest = function (req: ApiRequest, res: ApiResponse) {
    try {
      const data = metaRepo.findLatest(1)
      res.status(201).send(data)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  const update = function (req: ApiRequest, res: ApiResponse) {
    try {
      const body = getRequestBody<MetaWritePayload>(req)
      metaRepo.updateById(parseInt(paramString(req.params.id), 10), body as Record<string, unknown>)
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  const deleteOne = function (req: ApiRequest, res: ApiResponse) {
    try {
      metaRepo.deleteById(Number(req.params.id))
      const dir = path.join(metaFolder, req.params.id)
      fs.rmSync(dir, {
        recursive: true,
        force: true
      })
      res.sendStatus(201)
    } catch (err: unknown) {
      res.status(500).send({
        message: apiErrorMessage(err) || "Some error occurred while performing query."
      })
    }
  }

  return {
    create,
    findAll,
    findOne,
    findLatest,
    update,
    deleteOne
  }
}
