import type { ApiDb, AnyRecord, TagLike, MetaLike } from '../types/db'

const { cleanComparable, tokenizeFilePath } = require('./pathTokenizer')

function getTagTerms(tag: TagLike) {
  const synonyms = String(tag.synonyms || '')
    .split(',')
    .map(i => i.trim())
    .filter(Boolean)

  return [tag.name, ...synonyms].filter(Boolean)
}

function exactMatchPath(filePath: string, tag: TagLike) {
  const parsed = tokenizeFilePath(filePath)
  const candidates = new Set([parsed.file, ...parsed.folders].map(cleanComparable).filter(Boolean))
  const tokensBySegment = new Map()

  for (const item of parsed.tokens) {
    const key = `${item.source}:${item.segment}`
    if (!tokensBySegment.has(key)) tokensBySegment.set(key, [])
    tokensBySegment.get(key).push(item.token)
  }

  for (const tokens of tokensBySegment.values()) {
    for (let size = 1; size <= tokens.length; size++) {
      for (let i = 0; i <= tokens.length - size; i++) {
        candidates.add(tokens.slice(i, i + size).join(''))
      }
    }
  }

  return getTagTerms(tag).some(term => {
    const cleanTerm = cleanComparable(term)
    if (!cleanTerm || cleanTerm.length < 2) return false

    return candidates.has(cleanTerm)
  })
}

async function matchPathToTags(
  db: ApiDb,
  filePath: string,
  mediaId: unknown,
  tags: TagLike[],
  metas: MetaLike[],
  settings: AnyRecord = {},
) {
  const parserMetaIds = new Set(
    metas
      .filter((meta) => meta.parser)
      .map((meta) => Number(meta.id))
  )
  const requestedMetaIds = Array.isArray(settings.metaIds) && settings.metaIds.length
    ? new Set((settings.metaIds as unknown[]).map(Number))
    : null
  const values = []

  for (const tag of tags) {
    const metaId = Number(tag.metaId)
    if (!parserMetaIds.has(metaId)) continue
    if (requestedMetaIds && !requestedMetaIds.has(metaId)) continue

    if (exactMatchPath(filePath, tag)) {
      values.push({ tagId: tag.id, metaId: tag.metaId, mediaId, score: 1, source: 'exact' })
    }
  }

  const seen = new Set()
  return values.filter(value => {
    const key = `${value.mediaId}:${value.metaId}:${value.tagId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

module.exports = {
  exactMatchPath,
  matchPathToTags,
}
