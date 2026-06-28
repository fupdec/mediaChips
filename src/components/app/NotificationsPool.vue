<template>
  <div class="notifications-pool">
    <transition-group name="slide-x-transition">
      <template
        v-for="(item, index) in limitedItems"
        :key="item.key"
      >
        <v-card
          v-if="item.kind === 'task-summary'"
          :class="{'d-none': index > 1}"
          class="task-summary"
          elevation="9"
          rounded="lg"
        >
          <v-btn color="secondary" class="task-summary__icon" variant="tonal" icon>
            <v-icon>mdi-progress-clock</v-icon>
          </v-btn>

          <div class="task-summary__body">
            <div class="task-summary__title">{{ item.title }}</div>
            <div class="task-summary__text">{{ item.text }}</div>
            <div class="task-summary__actions">
              <v-btn
                @click="showAll"
                color="secondary"
                variant="text"
                size="small"
                class="task-summary__action"
              >
                <v-icon start>mdi-bell-outline</v-icon>
                {{ t('appbar.openNotificationsList') }}
              </v-btn>
            </div>
          </div>
        </v-card>

        <Notification
          v-else
          :notification="item.notification"
          :class="{'d-none': index > 1}"
        />
      </template>
    </transition-group>

    <v-btn
      v-if="poolItems.length > 2"
      @click="showAll"
      style="width: 300px; pointer-events: all;"
      color="primary"
      elevation="10"
      rounded
    >
      Show all notifications (+{{ poolItems.length - 2 }})
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useTasksStore } from '@/stores/tasks'
import { useI18n } from 'vue-i18n'
import Notification from '@/components/app/Notification.vue'
import type { NotificationInput } from '@/services/notificationService'

type PoolNotification = NotificationInput & { id: number; timestamp?: number; title?: string }

interface PoolItemBase {
  key: string
}

interface TaskSummaryItem extends PoolItemBase {
  kind: 'task-summary'
  title: string
  text: string
}

interface NotificationPoolItem extends PoolItemBase {
  kind: 'notification'
  notification: PoolNotification
  timestamp: number
}

type PoolItem = TaskSummaryItem | NotificationPoolItem

// Store
const notificationsStore = useNotificationsStore()
const tasksStore = useTasksStore()
const {t} = useI18n()
const taskSummaryVisible = ref(false)
const knownTaskIds = ref(new Set<string>())
const taskSummaryTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Computed properties
const notifications = computed(() => notificationsStore.getNotifications)
const tasks = computed(() => tasksStore.list)

const poolItems = computed((): PoolItem[] => {
  const notificationItems: NotificationPoolItem[] = notifications.value.map(notification => ({
    kind: 'notification',
    key: `notification-${notification.id}`,
    notification: notification as PoolNotification,
    timestamp: notification.timestamp || 0,
  }))

  const taskSummary: TaskSummaryItem[] = tasks.value.length > 0
    && taskSummaryVisible.value
    ? [{
      kind: 'task-summary' as const,
      key: 'task-summary',
      title: t('appbar.processStarted'),
      text: tasks.value.length === 1
        ? t('appbar.openProcessInNotifications')
        : t('appbar.activeProcessesCount', {count: tasks.value.length}),
    }]
    : []

  return [
    ...taskSummary,
    ...notificationItems,
  ]
})

const limitedItems = computed(() => {
  return poolItems.value.slice(0, 2)
})

// Methods
const hideTaskSummary = () => {
  taskSummaryVisible.value = false
  if (taskSummaryTimer.value) clearTimeout(taskSummaryTimer.value)
  taskSummaryTimer.value = null
}

const showTaskSummary = () => {
  taskSummaryVisible.value = true
  if (taskSummaryTimer.value) clearTimeout(taskSummaryTimer.value)
  taskSummaryTimer.value = setTimeout(() => {
    taskSummaryVisible.value = false
    taskSummaryTimer.value = null
  }, 5000)
}

const showAll = () => {
  hideTaskSummary()

  // Показываем все уведомления
  notificationsStore.show = true

  // Помечаем все уведомления как скрытые (чтобы показать их все в панели)
  notificationsStore.hideAllNotifications()
}

watch(
  () => tasks.value.map(task => task.id),
  (ids) => {
    const previous = knownTaskIds.value
    const hasNewTask = ids.some(id => !previous.has(id))
    knownTaskIds.value = new Set(ids)

    if (ids.length === 0) {
      hideTaskSummary()
      return
    }

    if (hasNewTask) {
      showTaskSummary()
    }
  },
  {immediate: true}
)

watch(
  () => notificationsStore.show,
  (show) => {
    if (show) hideTaskSummary()
  }
)

onUnmounted(() => {
  if (taskSummaryTimer.value) clearTimeout(taskSummaryTimer.value)
})
</script>

<style scoped lang="scss">
.notifications-pool {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-content: flex-end;
  justify-content: flex-start;
  position: fixed;
  top: 55px;
  right: 15px;
  width: 100%;
  height: calc(100vh - 65px);
  z-index: 10005;
  pointer-events: none;

  // Добавляем отступы для анимаций
  padding: 10px;
  box-sizing: border-box;
}

.d-none {
  display: none !important;
}

.task-summary {
  display: flex;
  align-items: flex-start;
  min-height: 90px;
  width: 370px;
  margin: 0 0 16px;
  padding: 16px 16px 25px;
  position: relative;
  overflow: hidden;
  pointer-events: all;
  transition: all 0.3s ease;

  &__body {
    padding-right: 25px;
    flex: 1;
  }

  &__icon {
    width: 48px;
    min-width: 48px;
    height: 48px;
    margin-right: 16px;
    border-radius: 50px;
    pointer-events: none;
  }

  &__title {
    font-size: 14px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 240px;
  }

  &__text {
    font-size: 12px;
    line-height: 1.4;
    max-width: 240px;
    margin-top: 4px;
    opacity: 0.7;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }

  &__action {
    min-width: 0;
  }
}

// Анимации для transition-group
.slide-x-transition-enter-active,
.slide-x-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.slide-x-transition-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.slide-x-transition-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.slide-x-transition-move {
  transition: transform 0.4s ease;
}

// Адаптивность
@media (max-width: 768px) {
  .notifications-pool {
    top: 45px;
    right: 10px;
    height: calc(100vh - 55px);
  }
}

@media (max-width: 480px) {
  .notifications-pool {
    top: 40px;
    right: 5px;
    left: 5px;
    align-items: center;

    .v-btn {
      width: 100%;
      max-width: 300px;
    }
  }
}
</style>