import type { RemoveEntitiesEvent, RemoveEntitiesPayload } from '@shared/api/responses'

export function normalizeRemoveEntitiesEvent(
  event: RemoveEntitiesEvent | undefined,
): RemoveEntitiesPayload | null {
  if (!event) return null
  if ('detail' in event && event.detail) {
    return event.detail
  }
  if ('ids' in event && 'type' in event) {
    return event
  }
  return null
}

export function normalizeEntityIds(
  ids?: Array<number | string | undefined>,
): number[] | undefined {
  if (!ids?.length) return ids?.length === 0 ? [] : undefined
  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
}
