import { PRIORITIES, type Task } from '@/types/task'
import type { TaskRepository } from './taskRepository'

export const TASKS_STORAGE_KEY = 'tasks'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.priority === 'string' &&
    (PRIORITIES as readonly string[]).includes(task.priority) &&
    (task.description === undefined || typeof task.description === 'string') &&
    (task.dueDate === undefined || typeof task.dueDate === 'string')
  )
}

function readTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isTask) : []
  } catch {
    // Corrupted or inaccessible storage: start from an empty list.
    return []
  }
}

function writeTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

// `randomUUID` exists only in secure contexts (https / localhost).
function createId(): string {
  return (
    crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}

/** Tasks are stored oldest-first: new tasks are appended to the end. */
export const localStorageTaskRepository: TaskRepository = {
  async list() {
    return readTasks()
  },

  async create(input) {
    const task: Task = { ...input, id: createId(), completed: false }
    writeTasks([...readTasks(), task])
    return task
  },

  async update(id, patch) {
    const tasks = readTasks()
    const current = tasks.find((task) => task.id === id)
    if (!current) throw new Error(`Task ${id} not found`)
    const updated: Task = { ...current, ...patch, id }
    writeTasks(tasks.map((task) => (task.id === id ? updated : task)))
    return updated
  },

  async remove(id) {
    writeTasks(readTasks().filter((task) => task.id !== id))
  },
}
