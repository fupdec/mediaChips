import mitt, { type Handler } from 'mitt'

type EventBusEvents = Record<string, unknown>

const emitter = mitt<EventBusEvents>()

export const eventBus = {
  $on: emitter.on.bind(emitter),
  $off: emitter.off.bind(emitter),
  $emit: emitter.emit.bind(emitter),

  $once(event: string, handler: Handler) {
    const onceHandler: Handler = (...args) => {
      handler(...args)
      this.$off(event, onceHandler)
    }
    this.$on(event, onceHandler)
  },

  clear(event?: string) {
    if (event) {
      emitter.all.delete(event)
    } else {
      emitter.all.clear()
    }
  },
}

export const useEventBus = () => {
  const listeners: Array<{ event: string; handler: Handler }> = []

  const on = (event: string, handler: Handler) => {
    eventBus.$on(event, handler)
    listeners.push({ event, handler })
  }

  const once = (event: string, handler: Handler) => {
    eventBus.$once(event, handler)
    listeners.push({ event, handler })
  }

  const off = (event: string, handler?: Handler) => {
    eventBus.$off(event, handler)
  }

  const emit = eventBus.$emit

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
    clearAll,
  }
}

export default eventBus
