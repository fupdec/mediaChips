export type ChipVariant = 'text' | 'flat' | 'elevated' | 'outlined' | 'plain' | 'tonal'

const CHIP_VARIANTS: ReadonlySet<string> = new Set([
  'text',
  'flat',
  'elevated',
  'outlined',
  'plain',
  'tonal',
])

export function toChipVariant(value: unknown): ChipVariant | undefined {
  if (typeof value === 'string' && CHIP_VARIANTS.has(value)) {
    return value as ChipVariant
  }
  return undefined
}
