import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TASK_VIEW,
  getTaskStats,
  getVisibleTasks,
  isOverdue,
  type TaskView,
} from './taskView'
import type { Task } from '@/types/task'

// Oldest-first, as the store keeps them.
const tasks: Task[] = [
  { id: '1', title: 'Купить молоко', completed: false, priority: 'low', dueDate: '2030-01-10' },
  { id: '2', title: 'Написать отчёт', completed: true, priority: 'high' },
  { id: '3', title: 'Позвонить маме', completed: false, priority: 'high', dueDate: '2030-01-05' },
  { id: '4', title: 'Купить билеты', completed: false, priority: 'medium' },
]

const ids = (view: Partial<TaskView>) =>
  getVisibleTasks(tasks, { ...DEFAULT_TASK_VIEW, ...view }).map((task) => task.id)

describe('getVisibleTasks', () => {
  it('shows newest first by default', () => {
    expect(ids({})).toEqual(['4', '3', '2', '1'])
  })

  it('searches by title, ignoring case and surrounding spaces', () => {
    expect(ids({ query: '  КУПИТЬ ' })).toEqual(['4', '1'])
    expect(ids({ query: 'нет такого' })).toEqual([])
  })

  it('filters by status', () => {
    expect(ids({ status: 'active' })).toEqual(['4', '3', '1'])
    expect(ids({ status: 'completed' })).toEqual(['2'])
  })

  it('filters by priority', () => {
    expect(ids({ priority: 'high' })).toEqual(['3', '2'])
  })

  it('combines search and both filters', () => {
    expect(ids({ query: 'купить', status: 'active', priority: 'low' })).toEqual(['1'])
    expect(ids({ query: 'купить', status: 'completed' })).toEqual([])
  })

  it('sorts oldest first', () => {
    expect(ids({ sort: 'oldest' })).toEqual(['1', '2', '3', '4'])
  })

  it('sorts by priority, highest first, newest first within a priority', () => {
    expect(ids({ sort: 'priority' })).toEqual(['3', '2', '4', '1'])
  })

  it('sorts by due date, soonest first, tasks without a date last', () => {
    expect(ids({ sort: 'dueDate' })).toEqual(['3', '1', '4', '2'])
  })

  it('does not mutate the source array', () => {
    const copy = [...tasks]
    getVisibleTasks(tasks, { ...DEFAULT_TASK_VIEW, sort: 'priority' })
    expect(tasks).toEqual(copy)
  })
})

describe('getTaskStats', () => {
  it('counts completed and active tasks', () => {
    expect(getTaskStats(tasks)).toEqual({ completed: 1, active: 3 })
  })
})

describe('isOverdue', () => {
  const base: Task = { id: 'x', title: 't', completed: false, priority: 'low' }

  it('is true only for unfinished tasks whose due date has passed', () => {
    expect(isOverdue({ ...base, dueDate: '2020-01-01' }, '2020-01-02')).toBe(true)
    expect(isOverdue({ ...base, dueDate: '2020-01-02' }, '2020-01-02')).toBe(false)
    expect(isOverdue({ ...base, dueDate: '2020-01-01', completed: true }, '2020-01-02')).toBe(false)
    expect(isOverdue(base, '2020-01-02')).toBe(false)
  })
})
