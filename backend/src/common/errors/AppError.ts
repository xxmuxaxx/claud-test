/** An error that is safe to show to the API client: it carries the HTTP status and a stable code. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(404, code, message)
    this.name = 'NotFoundError'
  }
}
