import type { FastifyError, FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { AppError } from './AppError.js'
import { isRecordNotFound, isUniqueViolation } from './prismaErrors.js'

export interface ErrorBody {
  error: {
    code: string
    message: string
    details?: { path: string; message: string }[]
  }
}

const body = (
  code: string,
  message: string,
  details?: ErrorBody['error']['details'],
): ErrorBody => ({
  error: { code, message, ...(details && { details }) },
})

/**
 * Every failure leaves the API in one shape: `{ error: { code, message, details? } }`.
 * Unexpected errors are logged and reported as a generic 500 — internals never leak.
 */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    void reply
      .code(404)
      .send(
        body('ROUTE_NOT_FOUND', `Route ${request.method} ${request.url.split('?')[0]} not found`),
      )
  })

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(body(error.code, error.message))
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const details = error.validation.map((issue) => ({
        path: issue.instancePath.replace(/^\//, '').replaceAll('/', '.'),
        message: issue.message ?? 'Invalid value',
      }))
      return reply.code(400).send(body('VALIDATION_ERROR', 'Request validation failed', details))
    }

    if (isRecordNotFound(error)) {
      return reply.code(404).send(body('NOT_FOUND', 'Resource not found'))
    }
    if (isUniqueViolation(error)) {
      return reply.code(409).send(body('CONFLICT', 'Resource already exists'))
    }

    // Malformed JSON, unsupported media type, payload too large, ...
    const status = error.statusCode
    if (status && status >= 400 && status < 500) {
      return reply.code(status).send(body('BAD_REQUEST', error.message))
    }

    request.log.error(error)
    return reply.code(500).send(body('INTERNAL_ERROR', 'Internal server error'))
  })
}
