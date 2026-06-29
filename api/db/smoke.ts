import { sql } from 'drizzle-orm'
import type { DrizzleClient } from './client'

export function smokeTestDrizzle(drizzle: DrizzleClient): number {
  const row = drizzle.get<{count: number}>(sql`SELECT COUNT(*) AS count FROM media`)
  return Number(row?.count ?? 0)
}
