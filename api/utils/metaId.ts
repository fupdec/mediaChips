function resolveMetaId(param: unknown): number | null {
  if (typeof param === 'number' && Number.isFinite(param)) {
    return param
  }

  if (typeof param === 'string') {
    const trimmed = param.trim()
    if (!trimmed) return null

    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed)
    }

    const num = Number(trimmed)
    if (Number.isFinite(num) && Number.isInteger(num)) {
      return num
    }
  }

  return null
}

function normalizeMetaIdParam(param: unknown): unknown {
  const metaId = resolveMetaId(param)
  return metaId !== null ? metaId : param
}

module.exports = {
  resolveMetaId,
  normalizeMetaIdParam,
}

export { resolveMetaId, normalizeMetaIdParam }
