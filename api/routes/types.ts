import type { Express } from 'express'
import type { ApiDb } from '../types/db'

export type ApiRouteRegistrar = (app: Express, db: ApiDb) => void
