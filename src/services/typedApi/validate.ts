export function validated<T>(parser: (data: unknown) => T, data: unknown): T {
  try {
    return parser(data)
  } catch (error) {
    console.warn('[typedApi] Response validation failed:', error)
    return data as T
  }
}

export function validateRequest<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  return schema.parse(data)
}
