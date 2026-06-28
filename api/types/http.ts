import type { Express, Request, Response } from 'express'
import type { AnyRecord } from './db'
import type { ApiDb } from './db'

export type ApiRequest = Request & {
  body: AnyRecord
  query: AnyRecord
}

export type ApiResponse = Response

export type ApiRequestHandler = (
  req: ApiRequest,
  res: ApiResponse,
) => void | Promise<void>

export type ApiRouteRegistrar = (app: Express, db: import('./db').ApiDb) => void

export type { Express }
