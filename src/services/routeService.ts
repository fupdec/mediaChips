import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { TabLike } from '@/types/common'

export function getTabUrl(tab: TabLike): string {
  const params: Record<string, string | number> = {}

  Object.entries(tab).forEach(([key, val]) => {
    if (!val) return
    if (key === 'id') params.tabId = val as string | number
    else if (key.toLowerCase().includes('id')) params[key] = val as string | number
  })

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  )
  return tab.url + '?' + searchParams.toString()
}

export function getUrlParam(route: RouteLocationNormalizedLoaded, param: string): number | null {
  const value = route.query[param]
  return value ? +String(value) : null
}

export function checkCurrentPage(route: RouteLocationNormalizedLoaded, page: string): boolean {
  return route.path.includes(page)
}
