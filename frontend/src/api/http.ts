/** Base URL of the backend API; override with `VITE_API_BASE_URL` (see `.env.example`). */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
).replace(/\/+$/, '')

/** A failed request: the error reported by the server (`{ error: { code, message } }`) or a network failure. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  /** The server could not be reached at all. */
  get isNetworkError() {
    return this.status === 0
  }
}

export type QueryParams = Record<string, string | undefined>

interface RequestOptions {
  query?: QueryParams
  body?: unknown
}

function buildUrl(path: string, query?: QueryParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, value)
  }
  const search = params.toString()
  return `${API_BASE_URL}${path}${search ? `?${search}` : ''}`
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const { error } = (await response.json()) as { error?: { code?: string; message?: string } }
    return new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? response.statusText,
    )
  } catch {
    return new ApiError(response.status, 'HTTP_ERROR', response.statusText)
  }
}

/** The only place that talks HTTP. Resolves with the parsed JSON body (`undefined` for 204). */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  { query, body }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'The server is unreachable')
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
