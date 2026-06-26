const clean = (s) => String(s || '').replace(/[^a-zа-яё0-9]/giu, '').toLowerCase()

const tokenize = (s) => String(s || '')
  .replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, '$1 $2')
  .replace(/[_\-.()[\]{}]+/g, ' ')
  .split(/\s+/)
  .map(clean)
  .filter((value) => value.length > 2)

export function parseFilePath(filePath, mediaId, {tags = [], assigned = []} = {}) {
  filePath = filePath.substring(0, filePath.lastIndexOf('.'))

  const segments = filePath.split(/[\/\\]/).filter(Boolean)
  const strings = new Set(segments.map(clean).filter((value) => value.length > 2))

  for (const segment of segments) {
    const tokens = tokenize(segment)
    for (let size = 1; size <= tokens.length; size++) {
      for (let x = 0; x <= tokens.length - size; x++) {
        strings.add(tokens.slice(x, x + size).join(''))
      }
    }
  }

  const parsed = assigned.filter((item) => item.meta?.parser)
  const vals = []

  for (const meta of parsed) {
    const metaId = meta.metaId

    const found = tags
      .filter((tag) => {
        if (tag.metaId !== metaId) return false

        for (const str of strings) {
          if (str === clean(tag.name)) return true
          if (tag.synonyms) {
            for (const syn of tag.synonyms.split(',')) {
              if (str === clean(syn)) return true
            }
          }
        }
        return false
      })
      .map((item) => item.id)

    for (const id of new Set(found)) {
      vals.push({tagId: id, metaId, mediaId})
    }
  }

  return vals
}
