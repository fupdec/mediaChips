import type { Sequelize as SequelizeInstance } from 'sequelize'
import type { SequelizeQueryInterface } from './db'

export type SequelizeModule = typeof import('sequelize')

export type SequelizeModelFactory = (
  sequelize: SequelizeInstance,
  Sequelize: SequelizeModule,
) => unknown

export type MigrationContext = {
  context: SequelizeQueryInterface
}

export type MigrationFn = (ctx: MigrationContext) => Promise<void>
