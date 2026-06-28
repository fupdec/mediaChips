import type { Express } from 'express'
import type { ApiDb } from './db'

export type AppRegistrar = (app: Express, db: ApiDb) => void

export type { Express }
