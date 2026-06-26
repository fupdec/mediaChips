export function getTabUrl(tab) {
  const params = {}

  Object.entries(tab).forEach(([key, val]) => {
    if (!val) return
    if (key === 'id') params.tabId = val
    else if (key.toLowerCase().includes('id')) params[key] = val
  })

  const searchParams = new URLSearchParams(params)
  return tab.url + '?' + searchParams.toString()
}

export function getUrlParam(route, param) {
  const value = route.query[param]
  return value ? +value : null
}

export function checkCurrentPage(route, page) {
  return route.path.includes(page)
}
