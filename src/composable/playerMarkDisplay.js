export function getMarkIcon(mark, {variant = 'list'} = {}) {
  if (mark.type === 'favorite') return 'heart'
  if (mark.type === 'bookmark') return 'bookmark'
  if (mark.type === 'meta') return mark.meta?.icon || mark['tag.icon'] || 'tag'
  return variant === 'timeline' ? 'tooltip' : 'marker'
}

export function getMarkColor(mark, {variant = 'list'} = {}) {
  if (mark.type === 'favorite') return '#e91e63'
  if (mark.type === 'bookmark') return '#f44336'
  if (mark.type === 'meta') return mark['tag.color'] || mark.tag?.color || '#2196f3'
  return variant === 'timeline' ? '#ffffff' : 'primary'
}

export const getMarkListIcon = (mark) => getMarkIcon(mark, {variant: 'list'})
export const getMarkListColor = (mark) => getMarkColor(mark, {variant: 'list'})
export const getMarkTimelineIcon = (mark) => getMarkIcon(mark, {variant: 'timeline'})
export const getMarkTimelineColor = (mark) => getMarkColor(mark, {variant: 'timeline'})

export function getMarkTypeFilterValue(mark) {
  if (mark.type === 'meta') return mark.meta?.id || mark.metaId
  return mark.type
}

export function filterMarksByTypes(marks, selectedTypes) {
  return marks.filter((mark) => {
    const type = getMarkTypeFilterValue(mark)
    return selectedTypes.some((selected) => selected == type)
  })
}

export function formatMarkTimeRange(mark, formatDuration) {
  let time = formatDuration(mark.time)
  if (mark.end) {
    time += ` – ${formatDuration(mark.end)}`
  }
  return time
}

export function getMarkTimelinePositionStyle(mark, duration) {
  if (!duration) return ''
  return `left: ${mark.time / duration * 100}%;`
}

export function getMarkTimelineWidthStyle(mark, duration, controlsWidth) {
  if (!duration || !controlsWidth) return ''

  const start = mark.time
  const end = mark.end || mark.time
  const widthPercentage = (end - start) / duration * 100
  return `width: ${controlsWidth / 100 * widthPercentage}px;`
}
