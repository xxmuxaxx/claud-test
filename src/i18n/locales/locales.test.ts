import { describe, expect, it } from 'vitest'
import en from './en'
import ka from './ka'
import ru from './ru'

type Tree = { [key: string]: string | Tree }

/** Flattens a nested dictionary into `dotted.key -> string` entries. */
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((result, [key, value]) => {
    const path = prefix + key
    return typeof value === 'string'
      ? { ...result, [path]: value }
      : { ...result, ...flatten(value, `${path}.`) }
  }, {})
}

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort()
const tags = (text: string) => [...text.matchAll(/<\/?(\w+)>/g)].map((m) => m[1]).sort()

const source = flatten(ru)

describe.each([
  ['en', en],
  ['ka', ka],
])('%s locale', (_name, locale) => {
  const translated = flatten(locale)

  it('has exactly the same keys as the source locale', () => {
    expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort())
  })

  it('has no empty strings', () => {
    expect(Object.entries(translated).filter(([, value]) => value.trim() === '')).toEqual([])
  })

  it('keeps interpolation placeholders and markup tags intact', () => {
    for (const [key, value] of Object.entries(translated)) {
      expect(placeholders(value), key).toEqual(placeholders(source[key]))
      expect(tags(value), key).toEqual(tags(source[key]))
    }
  })
})
