import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const { cosineSimilarity, embedText } = require('./embeddingModel')
const { tokenizeFilePath } = require('./pathTokenizer')

function getCandidatePhrases(filePath: string, options: Record<string, any> = {}) {
  const parsed = tokenizeFilePath(filePath, options)
  const grouped = new Map()

  for (const entry of parsed.tokens) {
    const key = `${entry.source}:${entry.segment}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(entry)
  }

  const candidates = []
  for (const entries of grouped.values()) {
    const maxWords = Math.min(Number(options.maxWords || 3), 3)
    for (let size = 1; size <= maxWords; size++) {
      for (let i = 0; i <= entries.length - size; i++) {
        const phraseEntries = entries.slice(i, i + size)
        const word = phraseEntries.map((entry: any) => entry.token).join(' ')
        const weight = phraseEntries.reduce((sum: any, entry: any) => sum + entry.weight, 0) / size
        candidates.push({
          word,
          source: phraseEntries[0].source,
          sample: phraseEntries[0].segment,
          words: size,
          weight,
        })
      }
    }
  }

  return candidates
}

function countPathTokens(media: AnyRecord[], options: Record<string, any> = {}) {
  const counts = new Map()
  const samples = new Map()
  const wordsCount = new Map()

  for (const item of media) {
    for (const candidate of getCandidatePhrases(String(item.path), options)) {
      const current = counts.get(candidate.word) || 0
      counts.set(candidate.word, current + candidate.weight)
      if (!samples.has(candidate.word)) samples.set(candidate.word, candidate.sample)
      if (!wordsCount.has(candidate.word)) wordsCount.set(candidate.word, candidate.words)
    }
  }

  return [...counts.entries()]
    .map(([word, occurrences]) => ({
      word,
      occurrences,
      sample: samples.get(word),
      words: wordsCount.get(word) || 1,
    }))
    .sort((a: any, b: any) => b.occurrences - a.occurrences)
}

function filterExistingTags(candidates: AnyRecord[], tags: any= []) {
  const existing = new Set(tags.map((tag: any) => String(tag.name || '').trim().toLowerCase()))
  return candidates.filter(candidate => !existing.has(String(candidate.word || '').toLowerCase()))
}

async function clusterCandidates(db: ApiDb, candidates: any, settings: Record<string, any> = {}) {
  if (!settings.useML) return candidates.map((i: any) => ({ ...i, cluster: [i.word] }))

  const threshold = Number(settings.clusterThreshold || 0.88)
  const clusters = []

  for (const candidate of candidates) {
    const embedding = await embedText(db, candidate.word)
    let found = null

    for (const cluster of clusters) {
      const similarity = cosineSimilarity(embedding, cluster.embedding)
      if (similarity >= threshold) {
        found = cluster
        break
      }
    }

    if (found) {
      found.occurrences += candidate.occurrences
      found.words.push(candidate.word)
      if (candidate.occurrences > found.best.occurrences) {
        found.word = candidate.word
        found.sample = candidate.sample
        found.best = candidate
      }
    } else {
      clusters.push({
        word: candidate.word,
        occurrences: candidate.occurrences,
        sample: candidate.sample,
        best: candidate,
        embedding,
        words: [candidate.word],
      })
    }
  }

  return clusters
    .map(({ embedding, best, ...cluster }) => ({
      ...cluster,
      cluster: cluster.words,
    }))
    .sort((a: any, b: any) => b.occurrences - a.occurrences)
}

async function suggestTagsFromMedia(db: ApiDb, media: any, settings: Record<string, any> = {}) {
  const limit = Number(settings.limit || 100)
  let candidates: AnyRecord[] = countPathTokens(media, {
    folderWeight: settings.folderWeight,
    maxWords: settings.maxWords,
  })

  if (settings.excludeExisting !== false) {
    const tags = settings.tags || await db.Tag.findAll({raw: true})
    candidates = filterExistingTags(candidates, tags)
  }

  candidates = candidates.slice(0, limit * 3)
  const clustered = await clusterCandidates(db, candidates, settings)

  return clustered.slice(0, limit)
}

module.exports = {
  countPathTokens,
  getCandidatePhrases,
  suggestTagsFromMedia,
}
