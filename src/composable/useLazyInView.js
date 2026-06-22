import {ref, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {getMainScrollEl} from '@/utils/mainScroll'

const DEFAULT_ROOT_MARGIN = '320px 0px'

export function useLazyInView(elementRef, options = {}) {
  const isInView = ref(false)
  const wasInView = ref(false)
  let observer = null

  const unobserve = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  const observe = () => {
    unobserve()
    const el = elementRef.value?.$el ?? elementRef.value
    if (!el) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isInView.value = entry.isIntersecting
          if (entry.isIntersecting) wasInView.value = true
        }
      },
      {
        root: getMainScrollEl() || null,
        rootMargin: options.rootMargin || DEFAULT_ROOT_MARGIN,
        threshold: 0,
      },
    )
    observer.observe(el)
  }

  const checkInitialVisibility = () => {
    const el = elementRef.value?.$el ?? elementRef.value
    const root = getMainScrollEl()
    if (!el) return

    const rect = el.getBoundingClientRect()
    const rootRect = root?.getBoundingClientRect() ?? {
      top: 0,
      bottom: window.innerHeight,
    }

    if (rect.bottom > rootRect.top && rect.top < rootRect.bottom) {
      isInView.value = true
      wasInView.value = true
    }
  }

  onMounted(() => {
    observe()
    nextTick(checkInitialVisibility)
  })
  onBeforeUnmount(unobserve)

  watch(elementRef, () => observe())

  return {isInView, wasInView}
}
