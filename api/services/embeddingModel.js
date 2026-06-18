const fs = require('fs')
const path = require('path')

const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2'

let extractor = null
let loadingPromise = null
let lastError = null
const textEmbeddingCache = new Map()

function getModelsRoot(db) {
  if (process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'models')
    if (fs.existsSync(bundled)) return bundled
  }

  const base = db?.path_databases || process.app_folder || path.join(__dirname, '../../app_storage')
  return path.join(base, 'models')
}

function getModelCacheDir(db) {
  return getModelsRoot(db)
}

function hasDownloadedModel(db) {
  const cacheDir = getModelCacheDir(db)
  if (!fs.existsSync(cacheDir)) return false

  const stack = [cacheDir]
  while (stack.length) {
    const dir = stack.pop()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) stack.push(entryPath)
      else if (/\.(onnx|json|txt)$/i.test(entry.name)) return true
    }
  }

  return false
}

async function loadModel(db) {
  if (extractor) return extractor
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const cacheDir = getModelCacheDir(db)
    fs.mkdirSync(cacheDir, { recursive: true })

    try {
      const transformers = require('@xenova/transformers')
      const { pipeline, env } = transformers

      env.cacheDir = cacheDir
      env.localModelPath = cacheDir
      env.allowRemoteModels = true
      env.allowLocalModels = true

      extractor = await pipeline('feature-extraction', DEFAULT_MODEL, {
        quantized: true,
      })
      lastError = null
      return extractor
    } catch (error) {
      lastError = error
      throw error
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}

async function embedText(db, text) {
  const normalized = String(text || '').trim().toLowerCase()
  if (textEmbeddingCache.has(normalized)) return textEmbeddingCache.get(normalized)

  const model = await loadModel(db)
  const output = await model(normalized, {
    pooling: 'mean',
    normalize: true,
  })

  const embedding = Array.from(output.data)
  textEmbeddingCache.set(normalized, embedding)
  return embedding
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (!normA || !normB) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function getStatus(db, useML) {
  if (!useML) return { status: 'disabled', model: DEFAULT_MODEL }
  if (extractor) return { status: 'loaded', model: DEFAULT_MODEL, path: getModelCacheDir(db) }
  if (loadingPromise) return { status: 'downloading', model: DEFAULT_MODEL, path: getModelCacheDir(db) }
  if (lastError) {
    return {
      status: 'error',
      model: DEFAULT_MODEL,
      path: getModelCacheDir(db),
      message: lastError.message,
    }
  }
  return {
    status: hasDownloadedModel(db) ? 'downloaded' : 'not_downloaded',
    model: DEFAULT_MODEL,
    path: getModelCacheDir(db),
  }
}

module.exports = {
  DEFAULT_MODEL,
  cosineSimilarity,
  embedText,
  getStatus,
  hasDownloadedModel,
  loadModel,
}
