import { describe, expect, it } from 'vitest'
import type { WikiArticle } from '@/types/wiki'
import {
  getExcerpt,
  normalizeTag,
  normalizeTags,
  sortByCreated,
  sortByUpdated,
  tagPath,
} from './wiki'

function article(overrides: Partial<WikiArticle> & Pick<WikiArticle, 'id'>): WikiArticle {
  return {
    title: overrides.id,
    content: '',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const react = article({
  id: 'react',
  title: 'React',
  description: 'Основные концепции',
  content: 'Компоненты и хуки',
  tags: ['frontend', 'javascript'],
  updatedAt: '2026-03-01T00:00:00.000Z',
})
const docker = article({
  id: 'docker',
  title: 'Docker',
  content: 'Контейнеры для React-приложений',
  tags: ['devops'],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
})
const ts = article({
  id: 'ts',
  title: 'TypeScript',
  tags: ['javascript', 'frontend'],
  updatedAt: '2026-04-01T00:00:00.000Z',
})
const all = [react, docker, ts]

describe('tags', () => {
  it('normalizes a tag: no #, lowercase, dashes instead of spaces', () => {
    expect(normalizeTag('  #React Hooks ')).toBe('react-hooks')
    expect(normalizeTag('##')).toBe('')
  })

  it('drops empty and duplicate tags, keeping order', () => {
    expect(normalizeTags(['#React', 'js', 'react', ' ', '#JS'])).toEqual(['react', 'js'])
  })
})

describe('tagPath', () => {
  it('encodes the tag for the URL', () => {
    expect(tagPath('react')).toBe('/wiki/tags/react')
    expect(tagPath('c#/net')).toBe('/wiki/tags/c%23%2Fnet')
  })
})

describe('sorting', () => {
  it('sorts by update and by creation date, newest first, without mutating the input', () => {
    expect(sortByUpdated(all).map((a) => a.id)).toEqual(['ts', 'react', 'docker'])
    expect(sortByCreated(all).map((a) => a.id)).toEqual(['docker', 'react', 'ts'])
    expect(all.map((a) => a.id)).toEqual(['react', 'docker', 'ts'])
  })
})

describe('getExcerpt', () => {
  it('prefers the description', () => {
    expect(getExcerpt(react)).toBe('Основные концепции')
  })

  it('falls back to plain text from the content, without Markdown syntax', () => {
    const md = article({
      id: 'md',
      content:
        '# Заголовок\n\nТекст с **жирным** и [ссылкой](https://x.dev).\n\n```\ncode\n```\n- пункт',
    })
    expect(getExcerpt(md)).toBe('Заголовок Текст с жирным и ссылкой. пункт')
  })

  it('truncates long text', () => {
    const long = article({ id: 'long', content: 'слово '.repeat(100) })
    const excerpt = getExcerpt(long, 20)
    expect(excerpt.endsWith('…')).toBe(true)
    expect(excerpt.length).toBeLessThanOrEqual(21)
  })
})
