const { cosineSimilarity, embedText } = require('./embeddingModel')
const { tokenizeFilePath } = require('./pathTokenizer')

function getCandidatePhrases(filePath, options = {}) {
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
        const word = phraseEntries.map(entry => entry.token).join(' ')
        const weight = phraseEntries.reduce((sum, entry) => sum + entry.weight, 0) / size
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

function countPathTokens(media, options = {}) {
  const counts = new Map()
  const samples = new Map()
  const wordsCount = new Map()

  for (const item of media) {
    for (const candidate of getCandidatePhrases(item.path, options)) {
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
    .sort((a, b) => b.occurrences - a.occurrences)
}

function filterExistingTags(candidates, tags = []) {
  const existing = new Set(tags.map(tag => String(tag.name || '').trim().toLowerCase()))
  return candidates.filter(candidate => !existing.has(candidate.word.toLowerCase()))
}

async function clusterCandidates(db, candidates, settings = {}) {
  if (!settings.useML) return candidates.map(i => ({ ...i, cluster: [i.word] }))

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
    .sort((a, b) => b.occurrences - a.occurrences)
}

async function suggestTagsFromMedia(db, media, settings = {}) {
  const limit = Number(settings.limit || 100)
  let candidates = countPathTokens(media, {
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
