import { ref, onMounted, onBeforeUnmount, watch, nextTick, type Ref } from 'vue'
import { getMainScrollEl } from '@/utils/mainScroll'

const DEFAULT_ROOT_MARGIN = '320px 0px'

type ElementRef = Ref<{ $el?: Element } | Element | null>

export function useLazyInView(
  elementRef: ElementRef,
  options: { rootMargin?: string } = {},
) {
  const isInView = ref(false)
  const wasInView = ref(false)
  let observer: IntersectionObserver | null = null

  const getElement = (): Element | null => {
    const value = elementRef.value
    if (!value) return null
    if ('$el' in value && value.$el instanceof Element) return value.$el
    if (value instanceof Element) return value
    return null
  }

  const unobserve = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  const observe = () => {
    unobserve()
    const el = getElement()
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
    const el = getElement()
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

  return { isInView, wasInView }
}
