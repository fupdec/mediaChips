function normalizeExt(ext: string | null | undefined) {
  const raw = String(ext || '').trim().toLowerCase()
  if (!raw) return null
  return raw.startsWith('.') ? raw : `.${raw}`
}

function parseExtList(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeExt).filter((ext): ext is string => Boolean(ext))
  }
  if (value === null || value === undefined || value === '') return []
  return String(value)
    .split(',')
    .map(normalizeExt)
    .filter((ext): ext is string => Boolean(ext))
}

function serializeExtList(value: string | string[] | null | undefined) {
  return parseExtList(value).join(',')
}

export {
  normalizeExt,
  parseExtList,
  serializeExtList,
}

module.exports = {
  normalizeExt,
  parseExtList,
  serializeExtList,
}
