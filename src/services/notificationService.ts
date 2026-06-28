import { useNotificationsStore } from '@/stores/notifications'

export interface NotificationInput {
  type?: 'info' | 'success' | 'warning' | 'error'
  text?: string
  timeout?: number
  icon?: string
  color?: string
  hidden?: boolean
  [key: string]: unknown
}

export function setNotification(data: NotificationInput): number {
  const notifications = useNotificationsStore()
  return notifications.setNotification(data)
}
