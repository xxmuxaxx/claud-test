import { NotFoundError } from '../../common/errors/AppError.js'
import { fromDateString, toTaskDto } from './tasks.mapper.js'
import type { TasksRepository } from './tasks.repository.js'
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './tasks.schemas.js'
import type { TaskDto, TaskStats } from './tasks.types.js'

const taskNotFound = () => new NotFoundError('TASK_NOT_FOUND', 'Task not found')

/** An empty description means "no description"; the database keeps NULL for that. */
const blankToNull = (value: string | null | undefined) => value || null

export class TasksService {
  constructor(private readonly repository: TasksRepository) {}

  async list(query: ListTasksQuery): Promise<TaskDto[]> {
    const order =
      query.order ?? (query.sort === 'title' || query.sort === 'dueDate' ? 'asc' : 'desc')
    return (await this.repository.list({ ...query, order })).map(toTaskDto)
  }

  async get(id: string): Promise<TaskDto> {
    const task = await this.repository.findById(id)
    if (!task) throw taskNotFound()
    return toTaskDto(task)
  }

  async create(input: CreateTaskInput): Promise<TaskDto> {
    const task = await this.repository.create({
      title: input.title,
      description: blankToNull(input.description),
      priority: input.priority,
      dueDate: input.dueDate ? fromDateString(input.dueDate) : null,
      completed: false,
    })
    return toTaskDto(task)
  }

  async update(id: string, patch: UpdateTaskInput): Promise<TaskDto> {
    const task = await this.repository.update(id, {
      title: patch.title,
      completed: patch.completed,
      priority: patch.priority,
      // `undefined` leaves a field alone; `null` clears it.
      description: patch.description === undefined ? undefined : blankToNull(patch.description),
      dueDate:
        patch.dueDate === undefined
          ? undefined
          : patch.dueDate === null
            ? null
            : fromDateString(patch.dueDate),
    })
    if (!task) throw taskNotFound()
    return toTaskDto(task)
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) throw taskNotFound()
  }

  stats(): Promise<TaskStats> {
    return this.repository.stats()
  }
}
