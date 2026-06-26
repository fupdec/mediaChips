import {useNotificationsStore} from '@/stores/notifications'

export function setNotification(data) {
  const notifications = useNotificationsStore()
  return notifications.setNotification(data)
}
