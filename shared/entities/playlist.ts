export interface Playlist {
  id: number
  name?: string
  [key: string]: unknown
}

export interface PlaylistMediaLink {
  mediaId: number
  playlistId: number
  order?: number
  thumb?: string | null
  medium?: { name?: string }
  media?: { name?: string; [key: string]: unknown }
  [key: string]: unknown
}
