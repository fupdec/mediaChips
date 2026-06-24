export function sortPinnedAssignmentItems(items = []) {
  return [...items].sort((a, b) => {
    const orderA = Number.isFinite(a?.order) ? a.order : 0
    const orderB = Number.isFinite(b?.order) ? b.order : 0
    if (orderA !== orderB) return orderA - orderB
    return (a.meta?.name || '').localeCompare(b.meta?.name || '', undefined, {sensitivity: 'base'})
  })
}

export function getPinnedAssignmentOrder(assigned, metaId, {usePinnedMetaId = false} = {}) {
  const key = usePinnedMetaId ? 'pinnedMetaId' : 'metaId'
  const row = (assigned || []).find((i) => Number(i[key]) === Number(metaId))
  if (!row) return Number.MAX_SAFE_INTEGER
  return Number.isFinite(row?.order) ? row.order : Number.MAX_SAFE_INTEGER
}

export function sortByPinnedAssignmentOrder(
  items,
  assigned,
  getMetaId,
  {usePinnedMetaId = false} = {},
) {
  return [...items].sort((a, b) => {
    const orderA = getPinnedAssignmentOrder(assigned, getMetaId(a), {usePinnedMetaId})
    const orderB = getPinnedAssignmentOrder(assigned, getMetaId(b), {usePinnedMetaId})
    if (orderA !== orderB) return orderA - orderB

    const nameA = a.name || a.meta?.name || ''
    const nameB = b.name || b.meta?.name || ''
    return nameA.localeCompare(nameB, undefined, {sensitivity: 'base'})
  })
}

export function groupByPinnedAssignmentOrder(
  grouped,
  assigned,
  {usePinnedMetaId = false, getGroupMetaId = (key) => key} = {},
) {
  return Object.keys(grouped)
    .sort((keyA, keyB) => {
      const orderA = getPinnedAssignmentOrder(assigned, getGroupMetaId(keyA), {usePinnedMetaId})
      const orderB = getPinnedAssignmentOrder(assigned, getGroupMetaId(keyB), {usePinnedMetaId})
      if (orderA !== orderB) return orderA - orderB
      return String(keyA).localeCompare(String(keyB))
    })
    .map((key) => {
      const group = grouped[key]
      return [...group].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, {sensitivity: 'base'}),
      )
    })
}
