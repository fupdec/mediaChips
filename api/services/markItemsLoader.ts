import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

function normalizeMark(mark: any) {
  const json = mark.toJSON ? mark.toJSON() : mark

  if (json.media && !json.medium) {
    json.medium = json.media
  }

  return json
}

function matchesTypeFilter(mark: any, types: any) {
  if (!types.length) return false

  if (mark.type === 'favorite' && types.includes('favorite')) return true
  if (mark.type === 'bookmark' && types.includes('bookmark')) return true

  if (mark.type === 'meta') {
    const metaId = mark.tag?.metaId
    return types.some((type: any) => Number(type) === metaId)
  }

  return false
}

function matchesSearch(mark: any, search: any) {
  if (!search) return true

  const query = search.toLowerCase().trim()
  const fields = [
    mark.text,
    mark.medium?.name,
    mark.medium?.basename,
    mark.tag?.name,
  ]

  return fields.some((value: any) => value && String(value).toLowerCase().includes(query))
}

function getSortValue(mark: any, sortBy: any) {
  switch (sortBy) {
    case 'videoName':
      return (mark.medium?.name || mark.medium?.basename || '').toLowerCase()
    case 'type':
      return mark.type || ''
    case 'tagName':
      return (mark.tag?.name || '').toLowerCase()
    case 'id':
      return Number(mark.id) || 0
    case 'time':
    default:
      return Number(mark.time) || 0
  }
}

function sortMarks(items: AnyRecord[], sortBy: any= 'time', sortDir: any= 'desc') {
  const direction = sortDir === 'asc' ? 1 : -1

  return [...items].sort((a: any, b: any) => {
    const aVal = getSortValue(a, sortBy)
    const bVal = getSortValue(b, sortBy)

    if (typeof aVal === 'string' || typeof bVal === 'string') {
      return aVal.localeCompare(bVal, undefined, {sensitivity: 'base'}) * direction
    }

    if (aVal === bVal) return (Number(a.id) || 0) - (Number(b.id) || 0)
    return (aVal < bVal ? -1 : 1) * direction
  })
}

async function getMarkFilterMetas(db: ApiDb) {
  return db.Meta.findAll({
    where: {
      marks: true,
    },
    order: [
      ['order', 'ASC'],
      ['name', 'ASC'],
    ],
    raw: true,
  })
}

async function loadMarkItems(db: ApiDb, options: Record<string, any> = {}) {
  const {
    types = [],
    sortBy = 'time',
    sortDir = 'desc',
    page = 1,
    limit = 24,
    search = '',
  } = options

  const marks = await db.Mark.findAll({
    include: [{
      model: db.Tag,
      include: [{
        model: db.Meta,
      }],
    }, db.Media],
  })

  const allItems = marks.map(normalizeMark)
  const filtered = allItems.filter((mark: any) => (
    matchesTypeFilter(mark, types) && matchesSearch(mark, search)
  ))
  const sorted = sortMarks(filtered, sortBy, sortDir)

  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 24, 100))
  const offset = (safePage - 1) * safeLimit
  const pageItems = sorted.slice(offset, offset + safeLimit)

  return {
    items: pageItems,
    total: allItems.length,
    totalFiltered: sorted.length,
    page: safePage,
    limit: safeLimit,
    pages: Math.max(1, Math.ceil(sorted.length / safeLimit)),
  }
}

module.exports = {
  getMarkFilterMetas,
  loadMarkItems,
}
