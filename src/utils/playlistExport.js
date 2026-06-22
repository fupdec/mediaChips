import path from 'path-browserify'

const sanitizeTitle = (title) => String(title || '').replace(/,/g, ' - ')

const sanitizeFilename = (name) => String(name || 'playlist').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'playlist'

export function playlistExportFilename(name) {
  return `${sanitizeFilename(name)}.m3u8`
}

export function buildM3uPlaylist(videos, playlistName) {
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

export function downloadTextFile(content, filename) {
  const blob = new Blob([content], {type: 'application/vnd.apple.mpegurl;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
