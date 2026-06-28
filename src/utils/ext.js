export function normalizeExt(ext) {
  const raw = String(ext || '').trim().toLowerCase()
  if (!raw) return null
  return raw.startsWith('.') ? raw : `.${raw}`
}

export function parseExtList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeExt).filter(Boolean)
  }
  if (value === null || value === undefined || value === '') return []
  return String(value)
    .split(',')
    .map(normalizeExt)
    .filter(Boolean)
}

export function getExtensionOptions(mediaType) {
  const extensions = String(mediaType?.extensions || '')
    .split(',')
    .map((ext) => normalizeExt(ext))
    .filter(Boolean)

  return [...new Set(extensions)].sort()
}
