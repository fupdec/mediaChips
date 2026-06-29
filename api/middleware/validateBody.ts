import type { RequestHandler } from 'express'
import type { ZodError, ZodType } from 'zod'

function shouldLogValidationErrors() {
  return process.env.NODE_ENV !== 'production'
    || process.env.MEDIA_CHIPS_LOG_VALIDATION === '1'
}

function summarizePayload(payload: unknown) {
  if (payload == null || typeof payload !== 'object') return payload

  try {
    const json = JSON.stringify(payload)
    if (json.length <= 500) return payload
    return `${json.slice(0, 500)}…`
  } catch {
    return '[unserializable payload]'
  }
}

function logValidationFailure(
  req: Parameters<RequestHandler>[0],
  source: 'body' | 'query',
  error: ZodError,
) {
  if (!shouldLogValidationErrors()) return

  const payload = source === 'body' ? req.body : req.query

  console.warn('[validateBody] Invalid request', {
    method: req.method,
    path: req.path || req.url,
    source,
    errors: error.issues.map((issue) => ({
      path: issue.path.join('.') || '(root)',
      message: issue.message,
    })),
    payload: summarizePayload(payload),
  })
}

function validationErrorResponse(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  source: 'body' | 'query',
  error: ZodError,
) {
  logValidationFailure(req, source, error)

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
      return validationErrorResponse(req, res, 'body', result.error)
    }

    assignReadonlyRequestField(req, 'body', result.data)
    next()
  }
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query ?? {})

    if (!result.success) {
      return validationErrorResponse(req, res, 'query', result.error)
    }

    assignReadonlyRequestField(req, 'query', result.data)
    next()
  }
}
