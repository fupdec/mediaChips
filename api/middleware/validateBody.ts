import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

function validationErrorResponse(res: Parameters<RequestHandler>[1], source: 'body' | 'query', error: import('zod').ZodError) {
  return res.status(400).json({
    message: `Invalid request ${source}`,
    errors: error.issues.map((issue) => ({
      path: issue.path.join('.') || '(root)',
      message: issue.message,
    })),
  })
}

function assignReadonlyRequestField(
  req: Parameters<RequestHandler>[0],
  field: 'query' | 'body',
  value: unknown,
) {
  try {
    ;(req as unknown as Record<string, unknown>)[field] = value
  } catch {
    Object.defineProperty(req, field, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    })
  }
}

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {})

    if (!result.success) {
      return validationErrorResponse(res, 'body', result.error)
    }

    assignReadonlyRequestField(req, 'body', result.data)
    next()
  }
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query ?? {})

    if (!result.success) {
      return validationErrorResponse(res, 'query', result.error)
    }

    assignReadonlyRequestField(req, 'query', result.data)
    next()
  }
}
