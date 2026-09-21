import { vi } from 'vitest'
import { normalizeTags } from '@/lib/wiki'
import { PRIORITIES, type Task } from '@/types/task'
import type { WikiArticle } from '@/types/wiki'

/**
 * An in-memory stand-in for the backend REST API, installed as `fetch` in every test.
 * It mirrors the real API's contract (routes, query parameters, response shapes, error format,
 * search semantics); the real thing is covered by the backend's own tests against PostgreSQL.
 */

interface StoredTask extends Task {
  createdAt: string
  updatedAt: string
}

interface Route {
  method: string
  pattern: RegExp
  // Request bodies are arbitrary JSON; the routes validate what they use.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle: (match: RegExpMatchArray, url: URL, body: any) => Response | object | undefined
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const apiError = (status: number, code: string, message: string) =>
  json({ error: { code, message } }, status)

const taskDto = ({ dueDate, ...task }: StoredTask) => ({ ...task, dueDate: dueDate ?? null })

/** Every word must be found in one of the fields (case-insensitive). */
function matchesWords(fields: readonly string[], search: string | null): boolean {
  const words = (search ?? '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^#+/, ''))
    .filter(Boolean)
  const haystack = fields.map((field) => field.toLowerCase())
  return words.every((word) => haystack.some((field) => field.includes(word)))
}

const WEIGHTS = { title: 4, tags: 3, description: 2, content: 1 }

function relevance(article: WikiArticle, search: string): number {
  const words = search
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^#+/, ''))
    .filter(Boolean)
  const fields = {
    title: article.title.toLowerCase(),
    tags: article.tags.join(' '),
    description: (article.description ?? '').toLowerCase(),
    content: article.content.toLowerCase(),
  }
  let score = 0
  for (const word of words) {
    for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
      if (fields[key].includes(word)) score += WEIGHTS[key]
    }
  }
  return score
}

export class FakeBackend {
  tasks: StoredTask[] = []
  articles: WikiArticle[] = []
  /** Every request received: `"GET /tasks?status=active"`. */
  requests: string[] = []
  /** While true every request fails like an unreachable server. */
  offline = false
  private nextId = 1
  private clock = Date.parse('2026-01-01T00:00:00.000Z')
  private lastStamp = 0

  reset() {
    this.tasks = []
    this.articles = []
    this.requests = []
    this.offline = false
    this.nextId = 1
    this.clock = Date.parse('2026-01-01T00:00:00.000Z')
    this.lastStamp = 0
  }

  /** Tasks in creation order (oldest first), keeping the ids given. */
  seedTasks(tasks: Task[]) {
    for (const task of tasks) {
      const now = this.tick()
      this.tasks.push({ ...task, createdAt: now, updatedAt: now })
    }
  }

  seedArticles(articles: WikiArticle[]) {
    this.articles.push(...articles.map((article) => ({ ...article })))
  }

  /** Requests to a path (no query), e.g. `count('GET /articles')`. */
  count(prefix: string) {
    return this.requests.filter((request) => request.startsWith(prefix)).length
  }

  private tick(): string {
    this.clock += 1000
    return new Date(this.clock).toISOString()
  }

  /** Real time that never stands still: article timestamps are compared with the seeded ones. */
  private stamp(): string {
    this.lastStamp = Math.max(Date.now(), this.lastStamp + 1)
    return new Date(this.lastStamp).toISOString()
  }

  private newId() {
    return `id-${this.nextId++}`
  }

  // ── Routes ─────────────────────────────────────────────────────────────

  private routes: Route[] = [
    {
      method: 'GET',
      pattern: /^\/tasks$/,
      handle: (_m, url) => this.listTasks(url),
    },
    {
      method: 'GET',
      pattern: /^\/tasks\/stats$/,
      handle: () => {
        const completed = this.tasks.filter((task) => task.completed).length
        return { total: this.tasks.length, completed, active: this.tasks.length - completed }
      },
    },
    {
      method: 'POST',
      pattern: /^\/tasks$/,
      handle: (_m, _u, body) => {
        if (typeof body?.title !== 'string' || body.title.trim() === '') return this.invalid()
        const now = this.tick()
        const task: StoredTask = {
          id: this.newId(),
          title: body.title.trim(),
          description: body.description || undefined,
          completed: false,
          priority: PRIORITIES.includes(body.priority) ? body.priority : 'medium',
          dueDate: body.dueDate || undefined,
          createdAt: now,
          updatedAt: now,
        }
        this.tasks.push(task)
        return json(taskDto(task), 201)
      },
    },
    {
      method: 'GET',
      pattern: /^\/tasks\/([^/]+)$/,
      handle: ([, id]) => {
        const task = this.tasks.find((item) => item.id === id)
        return task ? taskDto(task) : apiError(404, 'TASK_NOT_FOUND', 'Task not found')
      },
    },
    {
      method: 'PATCH',
      pattern: /^\/tasks\/([^/]+)$/,
      handle: ([, id], _u, body) => {
        const task = this.tasks.find((item) => item.id === id)
        if (!task) return apiError(404, 'TASK_NOT_FOUND', 'Task not found')
        if ('title' in body && (typeof body.title !== 'string' || !body.title.trim())) {
          return this.invalid()
        }
        if ('description' in body) task.description = body.description || undefined
        if ('dueDate' in body) task.dueDate = body.dueDate ?? undefined
        for (const key of ['title', 'completed', 'priority'] as const) {
          if (key in body) Object.assign(task, { [key]: body[key] })
        }
        task.updatedAt = this.tick()
        return taskDto(task)
      },
    },
    {
      method: 'DELETE',
      pattern: /^\/tasks\/([^/]+)$/,
      handle: ([, id]) => {
        if (!this.tasks.some((task) => task.id === id)) {
          return apiError(404, 'TASK_NOT_FOUND', 'Task not found')
        }
        this.tasks = this.tasks.filter((task) => task.id !== id)
        return new Response(null, { status: 204 })
      },
    },
    {
      method: 'GET',
      pattern: /^\/articles$/,
      handle: (_m, url) => this.listArticles(url),
    },
    {
      method: 'GET',
      pattern: /^\/articles\/stats$/,
      handle: () => ({ total: this.articles.length }),
    },
    {
      method: 'GET',
      pattern: /^\/articles\/([^/]+)\/related$/,
      handle: ([, id]) => {
        const article = this.articles.find((item) => item.id === id)
        if (!article) return apiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')
        const shared = (other: WikiArticle) =>
          other.tags.filter((t) => article.tags.includes(t)).length
        return this.articles
          .filter((other) => other.id !== id && shared(other) > 0)
          .sort((a, b) => shared(b) - shared(a) || b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 3)
      },
    },
    {
      method: 'GET',
      pattern: /^\/articles\/([^/]+)$/,
      handle: ([, id]) =>
        this.articles.find((item) => item.id === id) ??
        apiError(404, 'ARTICLE_NOT_FOUND', 'Article not found'),
    },
    {
      method: 'POST',
      pattern: /^\/articles$/,
      handle: (_m, _u, body) => {
        if (typeof body?.title !== 'string' || body.title.trim() === '') return this.invalid()
        const now = this.stamp()
        const article: WikiArticle = {
          id: this.newId(),
          title: body.title.trim(),
          description: body.description || undefined,
          content: body.content ?? '',
          tags: normalizeTags(body.tags ?? []),
          createdAt: now,
          updatedAt: now,
        }
        this.articles.push(article)
        return json(article, 201)
      },
    },
    {
      method: 'PATCH',
      pattern: /^\/articles\/([^/]+)$/,
      handle: ([, id], _u, body) => {
        const article = this.articles.find((item) => item.id === id)
        if (!article) return apiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')
        if ('title' in body && (typeof body.title !== 'string' || !body.title.trim())) {
          return this.invalid()
        }
        if ('title' in body) article.title = body.title.trim()
        if ('description' in body) article.description = body.description || undefined
        if ('content' in body) article.content = body.content
        if ('tags' in body) article.tags = normalizeTags(body.tags)
        article.updatedAt = this.stamp()
        return article
      },
    },
    {
      method: 'DELETE',
      pattern: /^\/articles\/([^/]+)$/,
      handle: ([, id]) => {
        if (!this.articles.some((article) => article.id === id)) {
          return apiError(404, 'ARTICLE_NOT_FOUND', 'Article not found')
        }
        this.articles = this.articles.filter((article) => article.id !== id)
        return new Response(null, { status: 204 })
      },
    },
    {
      method: 'GET',
      pattern: /^\/tags$/,
      handle: () => {
        const counts = new Map<string, number>()
        for (const { tags } of this.articles) {
          for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
        }
        return [...counts]
          .map(([name, articleCount]) => ({ name, articleCount }))
          .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name))
      },
    },
  ]

  private invalid() {
    return apiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }

  private listTasks(url: URL) {
    const { searchParams: q } = url
    const status = q.get('status')
    const priority = q.get('priority')
    const sort = q.get('sort') ?? 'createdAt'
    const order = q.get('order') ?? (sort === 'title' || sort === 'dueDate' ? 'asc' : 'desc')
    const dir = order === 'asc' ? 1 : -1

    const rank = (task: StoredTask) => PRIORITIES.indexOf(task.priority)
    return this.tasks
      .filter((task) => matchesWords([task.title, task.description ?? ''], q.get('search')))
      .filter((task) => !status || status === 'all' || task.completed === (status === 'completed'))
      .filter((task) => !priority || task.priority === priority)
      .sort((a, b) => {
        if (sort === 'dueDate') {
          // Tasks without a date go last in either direction.
          if (a.dueDate === b.dueDate) return b.createdAt.localeCompare(a.createdAt)
          if (a.dueDate === undefined) return 1
          if (b.dueDate === undefined) return -1
          return a.dueDate < b.dueDate ? -dir : dir
        }
        const field = sort === 'updatedAt' ? 'updatedAt' : 'createdAt'
        const result =
          sort === 'priority'
            ? rank(a) - rank(b)
            : sort === 'title'
              ? a.title.localeCompare(b.title)
              : a[field].localeCompare(b[field])
        return result * dir || b.createdAt.localeCompare(a.createdAt)
      })
      .map(taskDto)
  }

  private listArticles(url: URL) {
    const { searchParams: q } = url
    const search = q.get('search') ?? ''
    const tag = q.get('tag')
    const matching = this.articles
      .filter((article) => !tag || article.tags.includes(tag))
      .filter((article) =>
        matchesWords(
          [article.title, article.description ?? '', article.content, ...article.tags],
          search,
        ),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return search.trim()
      ? matching.sort((a, b) => relevance(b, search) - relevance(a, search))
      : matching
  }

  // ── fetch ──────────────────────────────────────────────────────────────

  fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input))
    const method = init?.method ?? 'GET'
    if (this.offline) throw new TypeError('Failed to fetch')

    const path = url.pathname.replace(/^\/api\/v1/, '')
    /** Ids in the URL are percent-encoded. */
    const decoded = (match: RegExpMatchArray) => match.map((part) => decodeURIComponent(part))
    this.requests.push(`${method} ${path}${url.search}`)

    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    for (const route of this.routes) {
      const match = route.method === method ? path.match(route.pattern) : null
      if (!match) continue
      const result = route.handle(decoded(match) as RegExpMatchArray, url, body)
      if (result instanceof Response) return result
      return json(result ?? null)
    }
    return apiError(404, 'ROUTE_NOT_FOUND', `Route ${method} ${path} not found`)
  })
}

export const backend = new FakeBackend()
