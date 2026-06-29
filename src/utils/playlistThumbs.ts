import { loadMediaThumbUrls } from '@/utils/mediaThumbLoader'

interface PlaylistWithThumbs {
  previewIds?: Array<number | string>
  thumbs?: unknown[]
}

export async function loadPlaylistThumbs(
  playlists: PlaylistWithThumbs[],
  { mediaType = 'videos', mediaPath = '' }: { mediaType?: string; mediaPath?: string } = {},
): Promise<void> {
  const previewIds = [...new Set(
    playlists.flatMap((playlist) => (playlist.previewIds || []).slice(0, 4)),
  )]

  if (!previewIds.length) {
    for (const playlist of playlists) {
      playlist.thumbs = []
    }
    return
  }

  if (!mediaPath) {
    for (const playlist of playlists) {
      playlist.thumbs = []
    }
    return
  }

  try {
    const thumbsById = await loadMediaThumbUrls(mediaPath, mediaType, previewIds)

    for (const playlist of playlists) {
      playlist.thumbs = (playlist.previewIds || [])
        .slice(0, 4)
        .map((id) => thumbsById[id])
        .filter(Boolean)
    }
  } catch (error) {
    console.log('Error loading playlist thumbs:', error)
    for (const playlist of playlists) {
      playlist.thumbs = []
    }
  }
}
