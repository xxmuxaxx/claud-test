import { describe, expect, it } from 'vitest'
import { DEFAULT_TASK_VIEW, isOverdue, toTaskQuery, type TaskView } from './taskView'
import type { Task } from '@/types/task'

const query = (view: Partial<TaskView>) => toTaskQuery({ ...DEFAULT_TASK_VIEW, ...view })

describe('toTaskQuery', () => {
  it('sends nothing but the sort for the default view: newest first', () => {
    expect(query({})).toEqual({
      search: undefined,
      status: undefined,
      priority: undefined,
      sort: 'createdAt',
      order: 'desc',
    })
  })

  it('trims the search and drops it when blank', () => {
    expect(query({ query: '  купить ' }).search).toBe('купить')
    expect(query({ query: '   ' }).search).toBeUndefined()
  })

  it('passes status and priority filters, but not "all"', () => {
    expect(query({ status: 'active', priority: 'high' })).toMatchObject({
      status: 'active',
      priority: 'high',
    })
    expect(query({ status: 'completed' }).status).toBe('completed')
    expect(query({ status: 'all', priority: 'all' })).toMatchObject({
      status: undefined,
      priority: undefined,
    })
  })

  it('maps every sort option to a backend sort and direction', () => {
    expect(query({ sort: 'newest' })).toMatchObject({ sort: 'createdAt', order: 'desc' })
    expect(query({ sort: 'oldest' })).toMatchObject({ sort: 'createdAt', order: 'asc' })
    expect(query({ sort: 'priority' })).toMatchObject({ sort: 'priority', order: 'desc' })
    expect(query({ sort: 'dueDate' })).toMatchObject({ sort: 'dueDate', order: 'asc' })
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
