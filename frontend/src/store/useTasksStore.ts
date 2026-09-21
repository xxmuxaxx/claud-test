import { create } from 'zustand'
import { tasksApi } from '@/api/tasksApi'
import { DEFAULT_TASK_VIEW, toTaskQuery, type TaskView } from '@/lib/taskView'
import type { Task, TaskInput, TaskStats } from '@/types/task'

interface TasksState {
  /** The tasks matching `view`, in the order the backend returned them. */
  tasks: Task[]
  /** Counters over all tasks, whatever `view` is. */
  stats: TaskStats
  /** The view `tasks` was loaded for; mutations reload it. */
  view: TaskView
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** A request is in flight while `tasks` still shows the previous result. */
  refreshing: boolean
  error: unknown
  /** Loads the tasks for `view` (search, filters and sorting are done by the backend). */
  load: (view: TaskView) => Promise<void>
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (id: string, input: TaskInput) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

const EMPTY_STATS: TaskStats = { total: 0, active: 0, completed: 0 }

/** Only the latest `load` may write to the store: an older, slower response is dropped. */
let latestLoad = 0

export const useTasksStore = create<TasksState>((set, get) => {
  /** After a change the list may look different (filters, order) — ask the backend again. */
  const reload = () => get().load(get().view)

  return {
    tasks: [],
    stats: EMPTY_STATS,
    view: DEFAULT_TASK_VIEW,
    status: 'idle',
    refreshing: false,
    error: undefined,

    load: async (view) => {
      const request = ++latestLoad
      set((state) => ({
        view,
        status: state.status === 'ready' ? 'ready' : 'loading',
        refreshing: state.status === 'ready',
      }))
      try {
        const [tasks, stats] = await Promise.all([
          tasksApi.list(toTaskQuery(view)),
          tasksApi.stats(),
        ])
        if (request === latestLoad)
          set({ tasks, stats, status: 'ready', refreshing: false, error: undefined })
      } catch (error) {
        if (request === latestLoad) set({ status: 'error', refreshing: false, error })
      }
    },

    addTask: async (input) => {
      await tasksApi.create(input)
      await reload()
    },

    updateTask: async (id, input) => {
      // Optional fields are sent explicitly so that clearing them in the form really removes them.
      await tasksApi.update(id, { description: undefined, dueDate: undefined, ...input })
      await reload()
    },

    toggleTask: async (id) => {
      const task = get().tasks.find((item) => item.id === id)
      if (!task) return
      await tasksApi.update(id, { completed: !task.completed })
      await reload()
    },

    removeTask: async (id) => {
      await tasksApi.remove(id)
      await reload()
    },
  }
})
