import MetaTypes from '@/assets/MetaTypes'

interface TranslateHelpers {
  te?: (key: string) => boolean
  t?: (key: string) => string
}

export function getTextDataType(type: string, { te, t }: TranslateHelpers = {}) {
  const key = `meta.types.${type}`
  if (te?.(key)) {
    return t?.(key) || type
  }
  return MetaTypes.find((item: { value: string; text?: string }) => item.value === type)?.text || type
}

export function getIconDataType(type: string) {
  return MetaTypes.find((item: { value: string; icon?: string }) => item.value === type)?.icon
}
