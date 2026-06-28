function normalizeExt(ext) {
  const raw = String(ext || '').trim().toLowerCase()
  if (!raw) return null
  return raw.startsWith('.') ? raw : `.${raw}`
}

function parseExtList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeExt).filter(Boolean)
  }
  if (value === null || value === undefined || value === '') return []
  return String(value)
    .split(',')
    .map(normalizeExt)
    .filter(Boolean)
}

function serializeExtList(value) {
  return parseExtList(value).join(',')
}

module.exports = {
  normalizeExt,
  parseExtList,
  serializeExtList,
}
