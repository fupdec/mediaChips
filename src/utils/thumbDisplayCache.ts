const cache = new Map<string, string>()

export function getCachedThumb(key: string): string | undefined {
  return cache.get(key)
}

export function setCachedThumb(key: string, url: string | null | undefined): void {
  if (!url || url.includes('unavailable.png')) return
  cache.set(key, url)
}

export function setCachedMediaThumbs(
  folder: string,
  thumbs: Record<string | number, string>,
): void {
  for (const [id, url] of Object.entries(thumbs)) {
    setCachedThumb(mediaThumbKey(folder, id), url)
  }
}

export function setCachedTagThumbs(
  metaId: number | string,
  thumbs: Record<string | number, Record<string, string>>,
): void {
  for (const [tagId, typeMap] of Object.entries(thumbs)) {
    for (const [type, url] of Object.entries(typeMap)) {
      setCachedThumb(tagThumbKey(metaId, tagId, type), url)
    }
  }
}

export function mediaThumbKey(folder: string, id: number | string): string {
  return `media:${folder}:${id}`
}

export function tagThumbKey(
  metaId: number | string,
  tagId: number | string,
  type: string,
): string {
  return `tag:${metaId}:${tagId}:${type}`
}
