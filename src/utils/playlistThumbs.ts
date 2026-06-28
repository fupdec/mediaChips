import {apiClient} from '@/services/apiClient'

interface PlaylistWithThumbs {
  previewIds?: Array<number | string>
  thumbs?: unknown[]
}

export async function loadPlaylistThumbs(
  playlists: PlaylistWithThumbs[],
  { mediaType = 'videos' }: { mediaType?: string } = {},
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

  try {
    const response = await apiClient.post<{ thumbs?: Record<string, unknown> }>('/api/Media/thumbs', {
      ids: previewIds,
      mediaType,
    })
    const thumbsById = response.data?.thumbs || {}

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
