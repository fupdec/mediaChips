const path = require('path')
const {pathVariants} = require('../services/contentHash')

function normalizeUserPath(value) {
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

function normalizeMediaPath(value) {
  if (value == null || typeof value !== 'string') return value

  let result = normalizeUserPath(value)
  result = path.normalize(result)

  if (typeof result.normalize === 'function') {
    result = result.normalize('NFC')
  }

  return result
}

function pathsEquivalent(left, right) {
  if (!left || !right) return false
  if (left === right) return true

  const leftCanonical = normalizeMediaPath(left)
  const rightCanonical = normalizeMediaPath(right)

  if (leftCanonical === rightCanonical) return true
  if (leftCanonical.toLowerCase() === rightCanonical.toLowerCase()) return true

  const leftSet = new Set(pathVariants(leftCanonical).map((item) => item.toLowerCase()))

  return pathVariants(rightCanonical).some((item) => leftSet.has(item.toLowerCase()))
}

function buildPathLookupVariants(value) {
  const canonical = normalizeMediaPath(value)
  const variants = new Set(pathVariants(canonical))

  if (canonical) {
    variants.add(canonical)
  }

  return [...variants]
}

function isPathInsideFolder(filePath, folderPath) {
  if (!filePath || !folderPath) return false

  const normalizedFile = path.resolve(normalizeMediaPath(filePath))
  const normalizedFolder = path.resolve(normalizeMediaPath(folderPath))
  const relative = path.relative(normalizedFolder, normalizedFile)

  if (!relative || relative === '.') return false

  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

module.exports = {
  normalizeUserPath,
  normalizeMediaPath,
  pathsEquivalent,
  buildPathLookupVariants,
  isPathInsideFolder,
}
