import type { VForm } from 'vuetify/components'

export type VFormInstance = VForm | null

export function getErrorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status
}

export function getErrorResponseData<T = unknown>(error: unknown): T | undefined {
  return (error as { response?: { data?: T } })?.response?.data
}
