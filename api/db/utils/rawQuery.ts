import type { ApiDb } from '../../types/db'

export type SqlReplacements = Record<string, unknown>

export function bindNamedParameters(sql: string, replacements: SqlReplacements = {}) {
  const params: unknown[] = []
  const text = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, key: string) => {
    if (!(key in replacements)) return match

    const value = replacements[key]
    if (Array.isArray(value)) {
      if (!value.length) {
        return 'NULL'
      }
      params.push(...value)
      return value.map(() => '?').join(', ')
    }

    params.push(value)
    return '?'
  })

  return {text, params}
}

export function queryAll<T = Record<string, unknown>>(
  db: ApiDb,
  sql: string,
  replacements: SqlReplacements = {},
): T[] {
  const {text, params} = bindNamedParameters(sql, replacements)
  return db.sqlite.prepare(text).all(...params) as T[]
}

export function queryGet<T = Record<string, unknown>>(
  db: ApiDb,
  sql: string,
  replacements: SqlReplacements = {},
): T | undefined {
  const {text, params} = bindNamedParameters(sql, replacements)
  return db.sqlite.prepare(text).get(...params) as T | undefined
}

export async function queryAllAsync<T = Record<string, unknown>>(
  db: ApiDb,
  sql: string,
  replacements: SqlReplacements = {},
): Promise<T[]> {
  return queryAll<T>(db, sql, replacements)
}
