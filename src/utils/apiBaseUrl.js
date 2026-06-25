const DEFAULT_PORT = import.meta.env.VITE_PORT || 12321

export function resolveApiBaseUrl(config = {}, serverInfo = null) {
  if (serverInfo?.url) {
    return serverInfo.url.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const {protocol, port, origin} = window.location
    const appPort = String(config.port || DEFAULT_PORT)

    // When the UI is served from the app server, use that origin directly.
    // config.ip is the LAN address for remote clients, not for this session.
    if (['http:', 'https:'].includes(protocol) && port === appPort) {
      return origin.replace(/\/$/, '')
    }
  }

  const ip = config.ip || 'localhost'
  const port = config.port || DEFAULT_PORT
  return `http://${ip}:${port}`
}
