import type { MarkDisplayVariant, PlayerMark } from '@/types/player'

export function getMarkIcon(mark: PlayerMark, { variant = 'list' }: { variant?: MarkDisplayVariant } = {}) {
  if (mark.type === 'favorite') return 'heart'
  if (mark.type === 'bookmark') return 'bookmark'
  if (variant === 'timeline') return 'tooltip'
  if (mark.type === 'meta') return mark.meta?.icon || mark['tag.icon'] || 'tag'
  return 'marker'
}

export function getMarkColor(mark: PlayerMark, { variant = 'list' }: { variant?: MarkDisplayVariant } = {}) {
  if (mark.type === 'favorite') return '#e91e63'
  if (mark.type === 'bookmark') return '#f44336'
  if (mark.type === 'meta') return mark['tag.color'] || mark.tag?.color || '#2196f3'
  return variant === 'timeline' ? '#ffffff' : 'primary'
}

export const getMarkListIcon = (mark: PlayerMark) => getMarkIcon(mark, { variant: 'list' })
export const getMarkListColor = (mark: PlayerMark) => getMarkColor(mark, { variant: 'list' })
export const getMarkTimelineIcon = (mark: PlayerMark) => getMarkIcon(mark, { variant: 'timeline' })
export const getMarkTimelineColor = (mark: PlayerMark) => getMarkColor(mark, { variant: 'timeline' })

export function getMarkTypeFilterValue(mark: PlayerMark) {
  if (mark.type === 'meta') return mark.meta?.id || mark.metaId
  return mark.type
}

export function filterMarksByTypes(marks: PlayerMark[], selectedTypes: Array<string | number>) {
  return marks.filter((mark) => {
    const type = getMarkTypeFilterValue(mark)
    return selectedTypes.some((selected) => selected == type)
  })
}

export function formatMarkTimeRange(mark: PlayerMark, formatDuration: (time: number) => string) {
  let time = formatDuration(mark.time)
  if (mark.end) {
    time += ` – ${formatDuration(mark.end)}`
  }
  return time
}

export function getMarkTimelinePositionStyle(mark: PlayerMark, duration: number) {
  if (!duration) return ''
  return `left: ${mark.time / duration * 100}%;`
}

export function getMarkTimelineWidthStyle(mark: PlayerMark, duration: number, controlsWidth: number) {
  if (!duration || !controlsWidth) return ''

  const start = mark.time
  const end = mark.end || mark.time
  const widthPercentage = (end - start) / duration * 100
  return `width: ${controlsWidth / 100 * widthPercentage}px;`
}
