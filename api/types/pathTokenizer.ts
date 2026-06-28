export interface PathToken {
  token: string
  source: 'folder' | 'file'
  segment: string
  weight: number
}

export interface TokenizeOptions {
  minLength?: number
  folderWeight?: number
  fileWeight?: number
}

export interface TokenizeResult {
  folders: string[]
  file: string
  tokens: PathToken[]
  uniqueTokens: string[]
}
