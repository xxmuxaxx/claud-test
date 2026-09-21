import { ApiError } from '@/api/http'

/** i18n key describing a failed request; translate it at render time. */
export function errorMessageKey(error: unknown) {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return 'errors.network'
    if (error.code === 'VALIDATION_ERROR') return 'errors.validation'
  }
  return 'errors.generic'
}
