import { Prisma } from '../../generated/prisma/client.js'

/** Prisma error codes: https://www.prisma.io/docs/orm/reference/error-reference */
function hasPrismaCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

/** "An operation failed because it depends on one or more records that were required but not found." */
export const isRecordNotFound = (error: unknown) => hasPrismaCode(error, 'P2025')

export const isUniqueViolation = (error: unknown) => hasPrismaCode(error, 'P2002')
