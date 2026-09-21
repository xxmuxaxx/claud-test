import { describe, expect, it } from 'vitest'
import type { WikiArticle } from '@/types/wiki'
import {
  filterByTag,
  getExcerpt,
  getRelatedArticles,
  getTagCounts,
  normalizeTag,
  normalizeTags,
  searchArticles,
  sortByCreated,
  sortByUpdated,
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

  it('counts tags: most used first, then alphabetically', () => {
    expect(getTagCounts(all)).toEqual([
      { tag: 'frontend', count: 2 },
      { tag: 'javascript', count: 2 },
      { tag: 'devops', count: 1 },
    ])
  })

  it('filters articles by tag', () => {
    expect(filterByTag(all, 'javascript').map((a) => a.id)).toEqual(['react', 'ts'])
    expect(filterByTag(all, 'nope')).toEqual([])
  })
})

describe('sorting', () => {
  it('sorts by update and by creation date, newest first, without mutating the input', () => {
    expect(sortByUpdated(all).map((a) => a.id)).toEqual(['ts', 'react', 'docker'])
    expect(sortByCreated(all).map((a) => a.id)).toEqual(['docker', 'react', 'ts'])
    expect(all.map((a) => a.id)).toEqual(['react', 'docker', 'ts'])
  })
})

describe('searchArticles', () => {
  it('returns everything, newest first, for an empty query', () => {
    expect(searchArticles(all, '  ').map((a) => a.id)).toEqual(['ts', 'react', 'docker'])
  })

  it.each([
    ['title', 'typescr', ['ts']],
    ['description', 'концепции', ['react']],
    ['content', 'контейнеры', ['docker']],
    ['tag', 'devops', ['docker']],
    ['tag with a hash', '#devops', ['docker']],
  ])('finds by %s', (_field, query, ids) => {
    expect(searchArticles(all, query).map((a) => a.id)).toEqual(ids)
  })

  it('ignores case', () => {
    expect(searchArticles(all, 'DOCKER').map((a) => a.id)).toEqual(['docker'])
  })

  it('requires every word to match, in any field', () => {
    expect(searchArticles(all, 'react концепции').map((a) => a.id)).toEqual(['react'])
    expect(searchArticles(all, 'react typescript')).toEqual([])
  })

  it('ranks title matches above content matches', () => {
    // "react" is the title of one article and only mentioned in the content of another.
    expect(searchArticles(all, 'react').map((a) => a.id)).toEqual(['react', 'docker'])
  })

  it('returns nothing when nothing matches', () => {
    expect(searchArticles(all, 'zzz')).toEqual([])
  })
})

describe('getRelatedArticles', () => {
  it('finds articles with shared tags, excluding the article itself', () => {
    expect(getRelatedArticles(all, react).map((a) => a.id)).toEqual(['ts'])
  })

  it('ranks by number of shared tags, then by recency, and honours the limit', () => {
    const a = article({ id: 'a', tags: ['x', 'y', 'z'] })
    const one = article({ id: 'one', tags: ['x'], updatedAt: '2026-09-01T00:00:00.000Z' })
    const two = article({ id: 'two', tags: ['x', 'y'], updatedAt: '2026-02-01T00:00:00.000Z' })
    const three = article({
      id: 'three',
      tags: ['x', 'y', 'z'],
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(getRelatedArticles([a, one, two, three], a).map((r) => r.id)).toEqual([
      'three',
      'two',
      'one',
    ])
    expect(getRelatedArticles([a, one, two, three], a, 2).map((r) => r.id)).toEqual([
      'three',
      'two',
    ])
  })

  it('is empty for an untagged article', () => {
    expect(getRelatedArticles([...all, article({ id: 'bare' })], article({ id: 'bare' }))).toEqual(
      [],
    )
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
