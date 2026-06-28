import type { MediaType } from '@/types/media'

export function normalizeExt(ext: string | null | undefined): string | null {
  const raw = String(ext || '').trim().toLowerCase()
  if (!raw) return null
  return raw.startsWith('.') ? raw : `.${raw}`
}

export function parseExtList(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeExt).filter((ext): ext is string => Boolean(ext))
  }
  if (value === null || value === undefined || value === '') return []
  return String(value)
    .split(',')
    .map(normalizeExt)
    .filter((ext): ext is string => Boolean(ext))
}

export function getExtensionOptions(mediaType: Pick<MediaType, 'extensions'> | null | undefined): string[] {
  const extensions = String(mediaType?.extensions || '')
    .split(',')
    .map((ext) => normalizeExt(ext))
    .filter((ext): ext is string => Boolean(ext))

  return [...new Set(extensions)].sort()
}
