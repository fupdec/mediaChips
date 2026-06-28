import type { AppConfig, ServerInfo } from '@/types/common'

const DEFAULT_PORT = import.meta.env.VITE_PORT || 12321

export function resolveApiBaseUrl(config: AppConfig = {}, serverInfo: ServerInfo | null = null): string {
  if (serverInfo?.url) {
    return serverInfo.url.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const { protocol, port, origin } = window.location
    const appPort = String(config.port || DEFAULT_PORT)

    if (['http:', 'https:'].includes(protocol) && port === appPort) {
      return origin.replace(/\/$/, '')
    }
  }

  const ip = config.ip || 'localhost'
  const port = config.port || DEFAULT_PORT
  return `http://${ip}:${port}`
}
