import MetaTypes from '@/assets/MetaTypes.js'

export function getTextDataType(type, {te, t} = {}) {
  const key = `meta.types.${type}`
  if (te?.(key)) {
    return t(key)
  }
  return MetaTypes.find((item) => item.value === type)?.text || type
}

export function getIconDataType(type) {
  return MetaTypes.find((item) => item.value === type)?.icon
}
