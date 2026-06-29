'use strict'

import type BetterSqlite3NS from 'better-sqlite3'

const BetterSqlite3 = require('better-sqlite3') as typeof BetterSqlite3NS

const OPEN_READONLY = 0x00000001
const OPEN_READWRITE = 0x00000002
const OPEN_CREATE = 0x00000004
const OPEN_FULLMUTEX = 0x00010000

type SqlCallback = ((err: Error | null, rows?: unknown) => void) | null
type BindParams = unknown[] | Record<string, unknown> | unknown
type BetterSqliteDatabase = BetterSqlite3NS.Database

let verboseLogger: ((message: unknown) => void) | null = null

function parseArgs(args: unknown[]) {
  let callback: SqlCallback = null
  const mutableArgs = [...args]

  if (mutableArgs.length > 0 && typeof mutableArgs[mutableArgs.length - 1] === 'function') {
    callback = mutableArgs.pop() as SqlCallback
  }

  let params: BindParams = []
  if (mutableArgs.length === 1) {
    params = mutableArgs[0] as BindParams
  } else if (mutableArgs.length > 1) {
    params = mutableArgs
  }

  if (params == null) {
    params = []
  }

  return {params, callback}
}

function sanitizeBindValue(value: unknown): string | number | bigint | Buffer | null {
  if (value == null) {
    return null
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const type = typeof value
  if (type === 'number' || type === 'string' || type === 'bigint' || Buffer.isBuffer(value)) {
    return value as string | number | bigint | Buffer
  }

  return String(value)
}

function normalizeParams(params: BindParams): unknown[] | Record<string, unknown> {
  if (params == null) {
    return []
  }

  if (Array.isArray(params)) {
    return params.map(sanitizeBindValue)
  }

  if (typeof params !== 'object') {
    return [sanitizeBindValue(params)]
  }

  const keys = Object.keys(params)
  if (keys.length > 0 && keys.every((key) => /^\$\d+$/.test(key))) {
    const normalized: Record<string, unknown> = {}
    for (const key of keys) {
      const value = sanitizeBindValue((params as Record<string, unknown>)[key])
      normalized[key] = value
      normalized[key.slice(1)] = value
    }
    return normalized
  }

  const normalized: Record<string, unknown> = {}
  for (const key of keys) {
    const value = sanitizeBindValue((params as Record<string, unknown>)[key])
    if (/^[:@$]/.test(key)) {
      normalized[key] = value
    } else {
      normalized[`:${key}`] = value
    }
  }
  return normalized
}

function runStatement(
  db: BetterSqliteDatabase,
  method: 'run' | 'all' | 'get',
  sql: string,
  params: BindParams,
  callback: SqlCallback,
) {
  const boundParams = normalizeParams(params)

  try {
    if (method === 'run') {
      const result = Array.isArray(boundParams)
        ? db.prepare(sql).run(...boundParams)
        : db.prepare(sql).run(boundParams as Record<string, unknown>)

      if (callback) {
        const context = {
          lastID: result.lastInsertRowid,
          changes: result.changes,
        }
        callback.call(context, null)
      }

      return result
    }

    const stmt = db.prepare(sql)
    const result = Array.isArray(boundParams)
      ? stmt[method](...boundParams)
      : stmt[method](boundParams as Record<string, unknown>)

    if (callback) {
      callback(null, method === 'all' ? result : result)
    }

    return result
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))

    if (method === 'all' && err.message.includes('Use run() instead')) {
      const result = Array.isArray(boundParams)
        ? db.prepare(sql).run(...boundParams)
        : db.prepare(sql).run(boundParams as Record<string, unknown>)

      if (callback) {
        callback(null, [])
      }

      return result
    }

    if (callback) {
      callback(err)
      return
    }

    throw err
  }
}

class Database {
  filename: string
  _db!: BetterSqliteDatabase

  constructor(filename: string, mode?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) {
    if (typeof mode === 'function') {
      callback = mode
      mode = undefined
    }

    this.filename = filename

    try {
      const openMode = typeof mode === 'number' ? mode : undefined
      const readonly = openMode != null
        && (openMode & OPEN_READONLY) !== 0
        && (openMode & OPEN_READWRITE) === 0
      const fileMustExist = openMode != null
        && (openMode & OPEN_CREATE) === 0
        && filename !== ':memory:'

      this._db = new BetterSqlite3(filename, {
        readonly,
        fileMustExist,
        verbose: verboseLogger || undefined,
      })

      this._db.function('regexp', { deterministic: true, varargs: false }, (pattern: unknown, value: unknown) => {
        if (value == null || pattern == null) return 0

        try {
          return new RegExp(String(pattern), 'i').test(String(value)) ? 1 : 0
        } catch {
          return 0
        }
      })

      if (callback) {
        process.nextTick(() => callback(null))
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (callback) {
        process.nextTick(() => callback(err))
      } else {
        throw err
      }
    }
  }

  run(sql: string, ...args: unknown[]) {
    const {params, callback} = parseArgs(args)
    return runStatement(this._db, 'run', sql, params, callback)
  }

  all(sql: string, ...args: unknown[]) {
    const {params, callback} = parseArgs(args)
    return runStatement(this._db, 'all', sql, params, callback)
  }

  get(sql: string, ...args: unknown[]) {
    const {params, callback} = parseArgs(args)
    return runStatement(this._db, 'get', sql, params, callback)
  }

  serialize(callback?: () => void) {
    if (callback) {
      callback()
    }
  }

  parallelize(callback?: () => void) {
    if (callback) {
      callback()
    }
  }

  close(callback?: (err: Error | null) => void) {
    try {
      this._db.close()
      if (callback) {
        process.nextTick(() => callback(null))
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (callback) {
        process.nextTick(() => callback(err))
      } else {
        throw err
      }
    }
  }
}

module.exports = {
  Database,
  OPEN_READONLY,
  OPEN_READWRITE,
  OPEN_CREATE,
  OPEN_FULLMUTEX,
  verbose() {
    verboseLogger = console.log
    return module.exports
  },
}
