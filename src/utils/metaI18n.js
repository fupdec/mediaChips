const META_NAME_KEYS = {
  color: 'color',
  rating: 'rating',
  favorite: 'favorite',
  bookmark: 'bookmark',
  country: 'country',
}

export const getMetaName = (meta, t) => {
  const fallback = meta?.name || ''
  const key = META_NAME_KEYS[fallback.toString().trim().toLowerCase()]

  return key ? t(`meta.default_names.${key}`, fallback) : fallback
}
