export const HOME_WIDGET_IDS = [
  'stats',
  'extendedStats',
  'quickActions',
  'continue',
  'favorites',
  'topViews',
  'markers',
  'health',
  'topTags',
]

export const HOME_WIDGETS_WITH_LIMIT = [
  'continue',
  'favorites',
  'topViews',
  'markers',
  'topTags',
]

export const DEFAULT_HOME_WIDGETS_CONFIG = {
  order: [...HOME_WIDGET_IDS],
  enabled: {
    stats: true,
    extendedStats: true,
    quickActions: true,
    continue: true,
    favorites: true,
    topViews: true,
    markers: true,
    health: true,
    topTags: true,
  },
  limits: {
    continue: 12,
    favorites: 12,
    topViews: 12,
    markers: 8,
    topTags: 10,
  },
  collapsed: {
    extendedStats: false,
  },
}

function cloneDefaultConfig() {
  return {
    order: [...DEFAULT_HOME_WIDGETS_CONFIG.order],
    enabled: {...DEFAULT_HOME_WIDGETS_CONFIG.enabled},
    limits: {...DEFAULT_HOME_WIDGETS_CONFIG.limits},
    collapsed: {...DEFAULT_HOME_WIDGETS_CONFIG.collapsed},
  }
}

export function parseHomeWidgetsConfig(raw) {
  if (!raw) return cloneDefaultConfig()

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return mergeHomeWidgetsConfig(parsed)
  } catch {
    return cloneDefaultConfig()
  }
}

export function mergeHomeWidgetsConfig(parsed = {}) {
  const base = cloneDefaultConfig()
  const known = new Set(HOME_WIDGET_IDS)

  let order = Array.isArray(parsed.order)
    ? parsed.order.filter((id) => known.has(id))
    : [...base.order]

  for (const id of HOME_WIDGET_IDS) {
    if (!order.includes(id)) order.push(id)
  }

  const enabled = {...base.enabled}
  if (parsed.enabled && typeof parsed.enabled === 'object') {
    for (const id of HOME_WIDGET_IDS) {
      if (typeof parsed.enabled[id] === 'boolean') {
        enabled[id] = parsed.enabled[id]
      }
    }
  }

  const limits = {...base.limits}
  if (parsed.limits && typeof parsed.limits === 'object') {
    for (const id of HOME_WIDGETS_WITH_LIMIT) {
      const value = Number(parsed.limits[id])
      if (Number.isFinite(value)) {
        limits[id] = Math.min(Math.max(Math.round(value), 4), 24)
      }
    }
  }

  const collapsed = {...base.collapsed}
  if (parsed.collapsed && typeof parsed.collapsed === 'object') {
    for (const id of Object.keys(collapsed)) {
      if (typeof parsed.collapsed[id] === 'boolean') {
        collapsed[id] = parsed.collapsed[id]
      }
    }
  }

  return {order, enabled, limits, collapsed}
}

export function serializeHomeWidgetsConfig(config) {
  return JSON.stringify(mergeHomeWidgetsConfig(config))
}

export function setHomeWidgetCollapsed(rawConfig, widgetId, isCollapsed) {
  const config = mergeHomeWidgetsConfig(parseHomeWidgetsConfig(rawConfig))
  if (config.collapsed[widgetId] !== undefined) {
    config.collapsed[widgetId] = isCollapsed
  }
  return serializeHomeWidgetsConfig(config)
}
