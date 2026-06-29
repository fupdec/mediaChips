import mitt, { type Handler } from 'mitt'
import type { EventBusEvent, EventBusMap } from '@shared/events/map'

const emitter = mitt<EventBusMap>()

type EventHandler<K extends EventBusEvent> = Handler<EventBusMap[K]>

export const eventBus = {
  $on<K extends EventBusEvent>(event: K, handler: EventHandler<K>) {
    emitter.on(event, handler)
  },

  $off<K extends EventBusEvent>(event: K, handler?: EventHandler<K>) {
    emitter.off(event, handler)
  },

  $emit<K extends EventBusEvent>(event: K, payload?: EventBusMap[K]) {
    emitter.emit(event, payload as EventBusMap[K])
  },

  $once<K extends EventBusEvent>(event: K, handler: EventHandler<K>) {
    const onceHandler: EventHandler<K> = ((...args) => {
      handler(...args)
      this.$off(event, onceHandler)
    }) as EventHandler<K>
    this.$on(event, onceHandler)
  },

  clear(event?: EventBusEvent) {
    if (event) {
      emitter.all.delete(event)
    } else {
      emitter.all.clear()
    }
  },
}

export const useEventBus = () => {
  const listeners: Array<{ event: EventBusEvent; handler: Handler<unknown> }> = []

  const on = <K extends EventBusEvent>(event: K, handler: EventHandler<K>) => {
    eventBus.$on(event, handler)
    listeners.push({ event, handler: handler as Handler<unknown> })
  }

  const once = <K extends EventBusEvent>(event: K, handler: EventHandler<K>) => {
    eventBus.$once(event, handler)
    listeners.push({ event, handler: handler as Handler<unknown> })
  }

  const off = <K extends EventBusEvent>(event: K, handler?: EventHandler<K>) => {
    eventBus.$off(event, handler)
  }

  const emit = eventBus.$emit

  const clearAll = () => {
    listeners.forEach(({ event, handler }) => {
      eventBus.$off(event, handler as EventHandler<typeof event>)
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

export type { EventBusEvent, EventBusMap }
