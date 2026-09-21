import { beforeEach, describe, expect, it } from 'vitest'
import { TASKS_STORAGE_KEY } from '@/services/localStorageTaskRepository'
import { useTasksStore } from './useTasksStore'

const stored = () => JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) ?? '[]')

async function freshStore() {
  useTasksStore.setState({ tasks: [], status: 'idle' })
  await useTasksStore.getState().load()
}

describe('useTasksStore', () => {
  beforeEach(async () => {
    localStorage.clear()
    await freshStore()
  })

  it('creates an active task and persists it', async () => {
    await useTasksStore.getState().addTask({ title: 'Задача', priority: 'high' })

    const [task] = useTasksStore.getState().tasks
    expect(task).toMatchObject({ title: 'Задача', priority: 'high', completed: false })
    expect(task.id).toBeTruthy()
    expect(stored()).toEqual([task])
  })

  it('edits a task, including clearing optional fields', async () => {
    const { addTask, updateTask } = useTasksStore.getState()
    await addTask({
      title: 'Старое',
      description: 'Описание',
      priority: 'low',
      dueDate: '2030-01-01',
    })
    const { id } = useTasksStore.getState().tasks[0]

    await updateTask(id, { title: 'Новое', priority: 'medium' })

    const [task] = useTasksStore.getState().tasks
    expect(task).toEqual({ id, title: 'Новое', priority: 'medium', completed: false })
    expect(stored()).toEqual([task])
  })

  it('toggles completion back and forth', async () => {
    await useTasksStore.getState().addTask({ title: 'Задача', priority: 'low' })
    const { id } = useTasksStore.getState().tasks[0]

    await useTasksStore.getState().toggleTask(id)
    expect(useTasksStore.getState().tasks[0].completed).toBe(true)
    expect(stored()[0].completed).toBe(true)

    await useTasksStore.getState().toggleTask(id)
    expect(useTasksStore.getState().tasks[0].completed).toBe(false)
  })

  it('removes a task', async () => {
    const { addTask, removeTask } = useTasksStore.getState()
    await addTask({ title: 'Первая', priority: 'low' })
    await addTask({ title: 'Вторая', priority: 'low' })
    const [first] = useTasksStore.getState().tasks

    await removeTask(first.id)

    expect(useTasksStore.getState().tasks.map((task) => task.title)).toEqual(['Вторая'])
    expect(stored()).toHaveLength(1)
  })

  it('restores tasks from localStorage after a reload', async () => {
    await useTasksStore.getState().addTask({ title: 'Останется', priority: 'low' })

    await freshStore()

    expect(useTasksStore.getState().tasks.map((task) => task.title)).toEqual(['Останется'])
  })

  it('ignores corrupted storage contents', async () => {
    localStorage.setItem(TASKS_STORAGE_KEY, '{not json')
    await freshStore()
    expect(useTasksStore.getState().tasks).toEqual([])

    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify([{ id: '1', title: 'ok', completed: false, priority: 'low' }, { id: 2 }]),
    )
    await freshStore()
    expect(useTasksStore.getState().tasks.map((task) => task.id)).toEqual(['1'])
  })
})
