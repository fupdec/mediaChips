export interface JimpImage {
  width: number
  height: number
  getBuffer(mime: string, options?: { quality?: number }): Promise<Buffer>
  resize(options: { w?: number; h?: number }): Promise<JimpImage>
  crop(options: { x: number; y: number; w: number; h: number }): Promise<JimpImage>
}

export interface ImageSizeConstraints {
  width?: number
  height?: number
}

export interface ProcessAndSaveImageOptions {
  buffer: Buffer
  outputPath: string
  sizes?: ImageSizeConstraints
}
