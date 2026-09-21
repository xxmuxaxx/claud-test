import { create } from 'zustand'
import { taskRepository } from '@/services/taskRepository'
import type { Task, TaskInput } from '@/types/task'

interface TasksState {
  /** Ordered oldest-first. */
  tasks: Task[]
  status: 'idle' | 'loading' | 'ready'
  load: () => Promise<void>
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (id: string, input: TaskInput) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

function replaceTask(updated: Task) {
  return (state: TasksState) => ({
    tasks: state.tasks.map((task) => (task.id === updated.id ? updated : task)),
  })
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  status: 'idle',

  load: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    const tasks = await taskRepository.list()
    set({ tasks, status: 'ready' })
  },

  addTask: async (input) => {
    const task = await taskRepository.create(input)
    set((state) => ({ tasks: [...state.tasks, task] }))
  },

  updateTask: async (id, input) => {
    // Optional fields are sent explicitly so that clearing them in the form really removes them.
    const updated = await taskRepository.update(id, {
      description: undefined,
      dueDate: undefined,
      ...input,
    })
    set(replaceTask(updated))
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((item) => item.id === id)
    if (!task) return
    const updated = await taskRepository.update(id, { completed: !task.completed })
    set(replaceTask(updated))
  },

  removeTask: async (id) => {
    await taskRepository.remove(id)
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }))
  },
}))
