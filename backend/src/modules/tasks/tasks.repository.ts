import type { Prisma } from '../../generated/prisma/client.js'
import { isRecordNotFound } from '../../common/errors/prismaErrors.js'
import { escapeLike, splitSearchTerms } from '../../common/utils/search.js'
import type { PrismaClient } from '../../database/prisma.js'
import type { SortOrder } from '../../common/schemas/index.js'
import type { ListTasksQuery } from './tasks.schemas.js'
import type { TaskRecord, TaskStats } from './tasks.types.js'

/** A list query with every default resolved. */
export type TaskListParams = ListTasksQuery & { order: SortOrder }

function buildWhere({ search, status, priority }: ListTasksQuery): Prisma.TaskWhereInput {
  return {
    ...(status !== 'all' && { completed: status === 'completed' }),
    ...(priority && { priority }),
    // Every word must appear in the title or in the description.
    AND: splitSearchTerms(search)
      .map(escapeLike)
      .map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      })),
  }
}

function buildOrderBy({ sort, order }: TaskListParams): Prisma.TaskOrderByWithRelationInput[] {
  const primary: Prisma.TaskOrderByWithRelationInput =
    // Tasks without a due date go last in either direction.
    sort === 'dueDate' ? { dueDate: { sort: order, nulls: 'last' } } : { [sort]: order }
  // Stable, deterministic order for ties.
  return [primary, ...(sort === 'createdAt' ? [] : [{ createdAt: 'desc' as const }]), { id: 'asc' }]
}

export class TasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(query: TaskListParams): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({ where: buildWhere(query), orderBy: buildOrderBy(query) })
  }

  findById(id: string): Promise<TaskRecord | null> {
    return this.prisma.task.findUnique({ where: { id } })
  }

  create(data: Prisma.TaskCreateInput): Promise<TaskRecord> {
    return this.prisma.task.create({ data })
  }

  /** Returns null when the task does not exist. */
  async update(id: string, data: Prisma.TaskUpdateInput): Promise<TaskRecord | null> {
    try {
      return await this.prisma.task.update({ where: { id }, data })
    } catch (error) {
      if (isRecordNotFound(error)) return null
      throw error
    }
  }

  /** Returns false when the task does not exist. */
  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.task.deleteMany({ where: { id } })
    return count > 0
  }

  async stats(): Promise<TaskStats> {
    const [total, completed] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.task.count({ where: { completed: true } }),
    ])
    return { total, completed, active: total - completed }
  }
}
