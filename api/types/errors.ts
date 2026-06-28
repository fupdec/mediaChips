export function apiErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function apiErrorStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : undefined
}

export type ApiErrorLike = {
  code?: string
  required?: unknown
  available?: unknown
  message?: string
}

export function asApiError(error: unknown): ApiErrorLike & { message: string } {
  if (error && typeof error === 'object') {
    const record = error as ApiErrorLike
    return {
      code: record.code || errnoCode(error) || 'UNKNOWN',
      required: record.required,
      available: record.available,
      message: record.message || apiErrorMessage(error),
    }
  }
  return { message: apiErrorMessage(error), code: 'UNKNOWN' }
}

function errnoCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as {code?: unknown}).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}
