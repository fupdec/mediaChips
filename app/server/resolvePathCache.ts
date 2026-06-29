const DEFAULT_MAX_ENTRIES = 10000

class ResolvePathCache {
  private readonly maxEntries: number
  private readonly entries = new Map<string, string>()

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries
  }

  get(key: string): string | undefined {
    if (!this.entries.has(key)) {
      return undefined
    }

    const value = this.entries.get(key)!
    this.entries.delete(key)
    this.entries.set(key, value)
    return value
  }

  set(key: string, value: string): void {
    if (this.entries.has(key)) {
      this.entries.delete(key)
    } else if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value
      if (oldestKey) {
        this.entries.delete(oldestKey)
      }
    }

    this.entries.set(key, value)
  }

  delete(key: string): void {
    this.entries.delete(key)
  }

  clear(): void {
    this.entries.clear()
  }
}

const resolvePathCache = new ResolvePathCache()

function getCachedResolvedPath(cacheKey: string): string | undefined {
  return resolvePathCache.get(cacheKey)
}

function setCachedResolvedPath(cacheKey: string, resolvedPath: string): void {
  if (!cacheKey || !resolvedPath) {
    return
  }

  resolvePathCache.set(cacheKey, resolvedPath)
}

function invalidateResolvedPath(cacheKey: string): void {
  if (!cacheKey) {
    return
  }

  resolvePathCache.delete(cacheKey)
}

function clearResolvedPathCache(): void {
  resolvePathCache.clear()
}

export {
  ResolvePathCache,
  getCachedResolvedPath,
  setCachedResolvedPath,
  invalidateResolvedPath,
  clearResolvedPathCache,
}
