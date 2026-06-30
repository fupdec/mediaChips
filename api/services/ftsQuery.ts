export function buildFtsMatchQuery(rawQuery: string): string | null {
  const tokens = String(rawQuery || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/"/g, '""'))
    .filter((token) => token.length > 0)

  if (!tokens.length) return null

  return tokens.map((token) => `"${token}"*`).join(' AND ')
}

export function isFtsSearchAvailable(sqlite: { prepare: (sql: string) => { get: (...args: unknown[]) => unknown } }): boolean {
  const row = sqlite.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'media_fts' LIMIT 1`,
  ).get() as { name?: string } | undefined

  return Boolean(row?.name)
}
