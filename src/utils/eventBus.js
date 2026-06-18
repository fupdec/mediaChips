// src/utils/eventBus.js
import mitt from 'mitt'

// Создаем экземпляр event bus
const emitter = mitt()

/**
 * Основной event bus для использования в компонентах
 */
export const eventBus = {
  /**
   * Подписка на событие
   * @param {string} event - Имя события
   * @param {Function} handler - Обработчик
   */
  $on: emitter.on,

  /**
   * Отписка от события
   * @param {string} event - Имя события
   * @param {Function} handler - Обработчик (опционально)
   */
  $off: emitter.off,

  /**
   * Отправка события
   * @param {string} event - Имя события
   * @param {any} payload - Данные события
   */
  $emit: emitter.emit,

  /**
   * Однократная подписка на событие
   * @param {string} event - Имя события
   * @param {Function} handler - Обработчик
   */
  $once(event, handler) {
    const onceHandler = (...args) => {
      handler(...args)
      this.$off(event, onceHandler)
    }
    this.$on(event, onceHandler)
  },

  /**
   * Очистка всех обработчиков для события
   * @param {string} event - Имя события (опционально)
   */
  clear(event) {
    if (event) {
      emitter.all.delete(event)
    } else {
      emitter.all.clear()
    }
  }
}

/**
 * Composition API хук для использования event bus
 * с автоматической отпиской при размонтировании компонента
 */
export const useEventBus = () => {
  const listeners = []

  const on = (event, handler) => {
    eventBus.$on(event, handler)
    listeners.push({ event, handler })
  }

  const once = (event, handler) => {
    eventBus.$once(event, handler)
    listeners.push({ event, handler })
  }

  const off = (event, handler) => {
    eventBus.$off(event, handler)
  }

  const emit = eventBus.$emit

  // Функция для очистки всех подписок
  const clearAll = () => {
    listeners.forEach(({ event, handler }) => {
      eventBus.$off(event, handler)
    })
    listeners.length = 0
  }

  return {
    on,
    once,
    off,
    emit,
    clearAll
  }
}

// Экспорт для глобального использования
export default eventBus