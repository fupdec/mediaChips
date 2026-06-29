declare module 'connect-history-api-fallback' {
  import type { RequestHandler } from 'express'

  interface HistoryApiFallbackOptions {
    index?: string
    disableDotRule?: boolean
    rewrites?: Array<{
      from: RegExp
      to: string | ((context: { parsedUrl: { pathname?: string } }) => string)
    }>
    verbose?: boolean
  }

  function history(options?: HistoryApiFallbackOptions): RequestHandler

  export default history
}
