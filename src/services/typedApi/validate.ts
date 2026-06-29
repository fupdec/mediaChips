import { ZodError } from 'zod'

export function formatValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
  }

  if (error instanceof Error) return error.message
  return String(error)
}

export function validated<T>(parser: (data: unknown) => T, data: unknown): T {
  try {
    return parser(data)
  } catch (error) {
    console.warn('[typedApi] Response validation failed:', formatValidationError(error))
    return data as T
  }
}

export function validateRequest<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  return schema.parse(data)
}
