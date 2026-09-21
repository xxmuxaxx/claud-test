import type { Task, TaskInput } from '@/types/task'
import { localStorageTaskRepository } from './localStorageTaskRepository'

/**
 * Persistence contract for tasks. It mirrors a REST resource, so an HTTP-backed
 * implementation can replace the localStorage one by changing `taskRepository` below;
 * the store and UI depend only on this interface.
 */
export interface TaskRepository {
  list(): Promise<Task[]>
  create(input: TaskInput): Promise<Task>
  update(id: string, patch: Partial<Omit<Task, 'id'>>): Promise<Task>
  remove(id: string): Promise<void>
}

export const taskRepository: TaskRepository = localStorageTaskRepository
