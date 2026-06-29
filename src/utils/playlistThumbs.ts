import {typedApi} from '@/services/typedApi'

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
    const response = await typedApi.postMediaThumbs({
      ids: previewIds,
      mediaType,
    }, true)
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
