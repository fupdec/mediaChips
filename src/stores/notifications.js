// stores/notifications.js
import {defineStore} from 'pinia'

export const useNotificationsStore = defineStore('notifications', {  // Упрощаем имя
  state: () => ({
    show: false,
    notifications: [],
    options: {
      timeout: 5000,
      icon: 'information-outline',
      color: 'primary',
      hidden: false
    },
    types: {
      info: {icon: 'information-outline', color: 'info'},
      success: {icon: 'check-circle-outline', color: 'success'},
      warning: {icon: 'alert-outline', color: 'warning'},
      error: {icon: 'alert-circle-outline', color: 'error'},
    },
  }),
  getters: {
    getNotifications: (state) => state.notifications.filter(i => !i.hidden),
    getNotificationsHidden: (state) => state.notifications.filter(i => i.hidden),
    // Убираем дублирующийся геттер options, так как он уже есть в state
  },
  actions: {
    setNotification(notification) {
      // Объединяем настройки по типу и переданные опции
      const typeSettings = notification.type ? this.types[notification.type] || {} : {}

      // Создаем объект уведомления
      const newNotification = {
        id: Date.now(),
        timestamp: Date.now(),
        ...this.options,
        ...typeSettings,
        ...notification
      }

      // Если открыта панель уведомлений, скрываем уведомление в пуле
      if (this.show) {
        newNotification.hidden = true
      }

      // Добавляем в массив уведомлений
      this.notifications.push(newNotification)

      // Автоматическое скрытие через timeout
      if (newNotification.timeout && newNotification.timeout > 0) {
        setTimeout(() => {
          this.hideNotification(newNotification.id)
        }, newNotification.timeout)
      }

      return newNotification.id
    },

    closeNotification(notificationId) {
      // Полностью удаляем уведомление
      this.notifications = this.notifications.filter(n => n.id !== notificationId)
    },

    hideNotification(notificationId) {
      // Скрываем уведомление
      const found = this.notifications.find(i => i.id === notificationId)
      if (found) {
        found.hidden = true
      }
    },

    hideAllNotifications() {
      // Скрываем все
      this.notifications = this.notifications.map(i => {
        i.hidden = true;
        return i;
      })
    },

    closeAllNotifications() {
      this.notifications = []
      this.show = false
    },

    showNextNotification() {
      // Показываем следующее скрытое уведомление
      const hiddenNotifications = this.notifications.filter(n => n.hidden)
      if (hiddenNotifications.length > 0) {
        const nextNotification = hiddenNotifications[0]
        nextNotification.hidden = false
        this.show = true
      }
    }
  }
})

export default useNotificationsStore