import path from 'path-browserify'
import type { MediaItem } from '@/types/stores'

const sanitizeTitle = (title: unknown) => String(title || '').replace(/,/g, ' - ')

const sanitizeFilename = (name: unknown) => String(name || 'playlist').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'playlist'

export function playlistExportFilename(name: unknown): string {
  return `${sanitizeFilename(name)}.m3u8`
}

interface PlaylistVideoItem {
  medium?: MediaItem
  path?: string
  name?: string
}

export function buildM3uPlaylist(videos: PlaylistVideoItem[], playlistName?: string): string {
  const lines = ['#EXTM3U']

  if (playlistName) {
    lines.push(`#PLAYLIST:${sanitizeTitle(playlistName)}`)
  }

  for (const item of videos) {
    const medium = item.medium || item
    const filePath = medium?.path
    if (!filePath) continue

    const title = sanitizeTitle(medium.name || path.basename(filePath))
    lines.push(`#EXTINF:-1,${title}`)
    lines.push(filePath)
  }

  return lines.join('\n')
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], {type: 'application/vnd.apple.mpegurl;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
