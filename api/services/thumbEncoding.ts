import fs from 'fs/promises'
import path from 'path'

export async function readImageAsDataUrl(filePath: string): Promise<string | null> {
  try {
    const buffer = await fs.readFile(filePath)
    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function readFirstExistingImageDataUrl(
  baseDir: string,
  id: number | string,
  subfolders: string[],
  fileName = `${id}.jpg`,
): Promise<string | null> {
  for (const subfolder of subfolders) {
    const filePath = path.join(baseDir, subfolder, fileName)
    try {
      await fs.access(filePath)
      return readImageAsDataUrl(filePath)
    } catch {
      // try next candidate
    }
  }
  return null
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return []

  const results: R[] = new Array(items.length)
  let nextIndex = 0

  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex
      nextIndex += 1
      results[current] = await mapper(items[current])
    }
  })

  await Promise.all(workers)
  return results
}
