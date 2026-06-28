export function normalizePastedFilePath(value: unknown): unknown {
  if (value == null || typeof value !== 'string') return value

  let result = value.trim()
  if (result.length < 2) return result

  const first = result[0]
  const last = result[result.length - 1]
  const isQuoted =
    (first === "'" && last === "'") ||
    (first === '"' && last === '"') ||
    (first === '\u2018' && last === '\u2019') ||
    (first === '\u201C' && last === '\u201D') ||
    (first === '`' && last === '`')

  if (isQuoted) {
    result = result.slice(1, -1).trim()
  }

  return result
}

export function normalizePastedFilePathsText(value: unknown): unknown {
  if (value == null || typeof value !== 'string') return value

  return value
    .split('\n')
    .map((line) => (line.trim() ? normalizePastedFilePath(line) : line))
    .join('\n')
}
