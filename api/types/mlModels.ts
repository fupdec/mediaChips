export interface ModelStatus {
  status: string
  model: string
  path?: string
  message?: string
}

export interface ZeroShotClassificationRow {
  label: string
  score: number
}

export type ClipClassifierModel = (
  imagePath: string,
  prompts: string[],
) => Promise<ZeroShotClassificationRow[]>

export type EmbeddingVector = number[]

export interface FeatureExtractionModel {
  (
    text: string,
    options: { pooling: 'mean'; normalize: true },
  ): Promise<{ data: ArrayLike<number> }>
}
