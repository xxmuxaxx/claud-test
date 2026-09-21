import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/router'
import { useWikiStore } from '@/store/useWikiStore'
import { backend } from '@/test/fakeBackend'
import type { WikiArticle } from '@/types/wiki'

function article(overrides: Partial<WikiArticle> & Pick<WikiArticle, 'id'>): WikiArticle {
  return {
    title: overrides.id,
    content: '',
    tags: [],
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  }
}

const react = article({
  id: 'react',
  title: 'React',
  description: 'Основные концепции React',
  content: '# React\n\nБиблиотека для интерфейсов.\n\n## Hooks\n\nuseState и useEffect.',
  tags: ['frontend', 'javascript'],
  createdAt: '2026-09-20T12:00:00.000Z',
  updatedAt: '2026-09-21T12:00:00.000Z',
})
const typescript = article({
  id: 'typescript',
  title: 'TypeScript',
  description: 'Типизация для JavaScript',
  tags: ['javascript', 'frontend'],
  updatedAt: '2026-08-01T12:00:00.000Z',
})
const docker = article({
  id: 'docker',
  title: 'Docker',
  content: 'Контейнеры и образы',
  tags: ['devops'],
  updatedAt: '2026-07-01T12:00:00.000Z',
})
const samples = [react, typescript, docker]

/** What the backend has stored. */
const stored = (): WikiArticle[] => backend.articles

/** Renders the real routes at `path` with `articles` already on the (fake) backend. */
async function renderWiki(path = '/wiki', articles: WikiArticle[] = []) {
  backend.seedArticles(articles)
  useWikiStore.setState({ tags: [], total: 0, status: 'idle', error: undefined })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  render(<RouterProvider router={router} />)
  // Every wiki page renders nothing until the backend has answered.
  await screen.findByRole('heading', { level: 1 })
  return { user, router }
}

/** jsdom has no `matchMedia`; pretend the viewport is wide enough for the desktop layout. */
function mockDesktop() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const cardTitles = () =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

/** The cards are what the backend returned for the current search and tag. */
const expectCards = (expected: string[]) => waitFor(() => expect(cardTitles()).toEqual(expected))

describe('Wiki', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('empty state', () => {
    it('invites to create the first article', async () => {
      const { user, router } = await renderWiki()

      expect(screen.getByText('Ваша Wiki пока пуста')).toBeInTheDocument()
      expect(
        screen.getByText('Создайте первую статью и начните собирать свою базу знаний.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      const emptyState = screen.getByText('Ваша Wiki пока пуста').parentElement!.parentElement!
      await user.click(within(emptyState).getByRole('link', { name: 'Создать статью' }))
      expect(router.state.location.pathname).toBe('/wiki/new')
      expect(await screen.findByRole('heading', { name: 'Новая статья' })).toBeInTheDocument()
    })
  })

  describe('home page', () => {
    it('shows header, stats and a card per article', async () => {
      await renderWiki('/wiki', samples)

      expect(screen.getByRole('heading', { level: 1, name: 'Wiki' })).toBeInTheDocument()
      expect(screen.getByText('Ваша личная база знаний')).toBeInTheDocument()
      expect(screen.getByText('Статей: 3 · Тегов: 3')).toBeInTheDocument()
      // The header button and the "+" of the narrow top bar.
      for (const link of screen.getAllByRole('link', { name: 'Создать статью' })) {
        expect(link).toHaveAttribute('href', '/wiki/new')
      }

      const card = screen.getByRole('link', { name: /Основные концепции React/ })
      expect(card).toHaveAttribute('href', '/wiki/react')
      expect(within(card).getByText('#frontend')).toBeInTheDocument()
      expect(within(card).getByText('#javascript')).toBeInTheDocument()
      expect(within(card).getByText(/Обновлено: /)).toBeInTheDocument()
      expect(cardTitles()).toEqual(['React', 'TypeScript', 'Docker']) // Newest update first.
    })

    it('says "today" for an article updated today', async () => {
      const now = new Date().toISOString()
      await renderWiki('/wiki', [article({ id: 'fresh', title: 'Свежая', updatedAt: now })])

      expect(screen.getByText('Обновлено: сегодня')).toBeInTheDocument()
    })

    it('lists recently updated and recently created articles once there are enough', async () => {
      const many = [
        ...samples,
        article({ id: 'git', title: 'Git', createdAt: '2026-10-01T12:00:00.000Z' }),
      ]
      await renderWiki('/wiki', many)

      const updated = screen.getByRole('heading', { name: 'Недавно изменённые' }).parentElement!
      const created = screen.getByRole('heading', { name: 'Недавно созданные' }).parentElement!
      expect(within(updated).getAllByRole('link')[0]).toHaveTextContent('React')
      expect(within(created).getAllByRole('link')[0]).toHaveTextContent('Git')
    })

    it('hides the recent blocks for a small wiki', async () => {
      await renderWiki('/wiki', samples)

      expect(screen.queryByRole('heading', { name: 'Недавно изменённые' })).not.toBeInTheDocument()
    })
  })

  describe('search', () => {
    it.each([
      ['title', 'typescr', ['TypeScript']],
      ['description', 'концепции', ['React']],
      ['content', 'контейнеры', ['Docker']],
      ['tag', 'devops', ['Docker']],
    ])('finds by %s while typing (the backend searches)', async (_field, query, expected) => {
      const { user } = await renderWiki('/wiki', samples)

      await user.type(screen.getByPlaceholderText('Поиск по статьям...'), query)

      await expectCards(expected)
      expect(backend.requests).toContain(`GET /articles?search=${encodeURIComponent(query)}`)
    })

    it('waits for a pause in typing instead of sending a request per keystroke', async () => {
      const { user } = await renderWiki('/wiki', samples)
      const before = backend.count('GET /articles?')

      await user.type(screen.getByPlaceholderText('Поиск по статьям...'), 'typescript')
      await expectCards(['TypeScript'])

      expect(backend.count('GET /articles?') - before).toBeLessThanOrEqual(2)
    })

    it('ranks title matches above content matches', async () => {
      const { user } = await renderWiki('/wiki', [
        article({
          id: 'a',
          title: 'Заметка',
          content: 'Пишу про React',
          updatedAt: '2026-09-21T00:00:00.000Z',
        }),
        article({ id: 'b', title: 'React', updatedAt: '2026-01-01T00:00:00.000Z' }),
      ])

      await user.type(screen.getByPlaceholderText('Поиск по статьям...'), 'react')

      await expectCards(['React', 'Заметка'])
    })

    it('shows "Ничего не найдено" and recovers when the query is cleared', async () => {
      const { user } = await renderWiki('/wiki', samples)
      const search = screen.getByPlaceholderText('Поиск по статьям...')

      await user.type(search, 'zzz')
      expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument()

      await user.clear(search)
      await waitFor(() => expect(cardTitles()).toHaveLength(3))
    })

    it('keeps the query when the user comes back from an article', async () => {
      const { user, router } = await renderWiki('/wiki', samples)
      await user.type(screen.getByPlaceholderText('Поиск по статьям...'), 'docker')
      await user.click(screen.getByRole('link', { name: /Docker/ }))
      await screen.findByRole('heading', { level: 1, name: 'Docker' })

      await act(() => router.navigate(-1))

      expect(await screen.findByPlaceholderText('Поиск по статьям...')).toHaveValue('docker')
      await expectCards(['Docker'])
    })
  })

  describe('tags', () => {
    it('filters the list with tag chips and resets with "Все"', async () => {
      const { user } = await renderWiki('/wiki', samples)
      const filter = screen.getByRole('group', { name: 'Фильтр по тегам' })

      await user.click(within(filter).getByRole('button', { name: 'devops' }))
      await expectCards(['Docker'])
      expect(within(filter).getByRole('button', { name: 'devops' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(backend.requests).toContain('GET /articles?tag=devops')

      await user.click(within(filter).getByRole('button', { name: 'frontend' }))
      await expectCards(['React', 'TypeScript'])

      await user.click(within(filter).getByRole('button', { name: 'Все' }))
      await waitFor(() => expect(cardTitles()).toHaveLength(3))
    })

    it('combines a tag filter with a search query', async () => {
      const { user } = await renderWiki('/wiki', samples)

      await user.click(screen.getByRole('button', { name: 'frontend' }))
      await user.type(screen.getByPlaceholderText('Поиск по статьям...'), 'типизация')

      await expectCards(['TypeScript'])
    })

    it('has a page per tag with all its articles', async () => {
      const { user } = await renderWiki('/wiki/tags/javascript', samples)

      expect(screen.getByRole('heading', { level: 1, name: 'Тег #javascript' })).toBeInTheDocument()
      expect(cardTitles()).toEqual(['React', 'TypeScript'])

      await user.click(screen.getByRole('link', { name: 'Все статьи' }))
      expect(await screen.findByRole('heading', { level: 1, name: 'Wiki' })).toBeInTheDocument()
    })

    it('says so when a tag has no articles', async () => {
      await renderWiki('/wiki/tags/nothing', samples)

      expect(screen.getByText('Статей с этим тегом нет.')).toBeInTheDocument()
    })
  })

  describe('article page', () => {
    it('shows title, description, tags, rendered content and dates', async () => {
      await renderWiki('/wiki/react', samples)

      expect(screen.getByRole('heading', { level: 1, name: 'React' })).toBeInTheDocument()
      expect(screen.getByText('Основные концепции React')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '#frontend' })).toHaveAttribute(
        'href',
        '/wiki/tags/frontend',
      )
      expect(screen.getByRole('heading', { level: 3, name: 'Hooks' })).toBeInTheDocument()
      expect(screen.getByText('Создано: 20 сентября 2026 г.')).toBeInTheDocument()
      expect(screen.getByText('Изменено: 21 сентября 2026 г.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Редактировать/ })).toHaveAttribute(
        'href',
        '/wiki/react/edit',
      )
    })

    it('renders the supported Markdown syntax', async () => {
      const content = [
        '## Заголовок',
        '**жирный** и *курсив*',
        '- пункт списка',
        '1. первый',
        '> цитата',
        '`inline`',
        '```\nблок кода\n```',
        '---',
        '[сайт](https://example.com)',
        '| A | B |\n| - | - |\n| 1 | 2 |',
      ].join('\n\n')
      await renderWiki('/wiki/md', [article({ id: 'md', title: 'MD', content })])

      const body = screen.getByRole('article')
      expect(within(body).getByText('жирный').tagName).toBe('STRONG')
      expect(within(body).getByText('курсив').tagName).toBe('EM')
      expect(within(body).getByText('пункт списка').closest('ul')).not.toBeNull()
      expect(within(body).getByText('первый').closest('ol')).not.toBeNull()
      expect(within(body).getByText('цитата').closest('blockquote')).not.toBeNull()
      expect(within(body).getByText('inline').tagName).toBe('CODE')
      expect(within(body).getByText('блок кода').closest('pre')).not.toBeNull()
      expect(body.querySelector('hr')).not.toBeNull()
      expect(within(body).getByRole('table')).toBeInTheDocument()

      const link = within(body).getByRole('link', { name: 'сайт' })
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not render raw HTML from the content', async () => {
      await renderWiki('/wiki/xss', [
        article({ id: 'xss', title: 'XSS', content: '<script>alert(1)</script><b>bold</b>' }),
      ])

      const body = screen.getByRole('article')
      expect(body.querySelector('script, b')).toBeNull()
    })

    it('lists related articles with shared tags, but not unrelated ones or itself', async () => {
      await renderWiki('/wiki/react', samples)

      const related = await screen.findByRole('region', { name: 'Связанные статьи' })
      expect(
        within(related)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['TypeScript'])
    })

    it('omits the related block when nothing is related', async () => {
      await renderWiki('/wiki/docker', samples)
      await waitFor(() => expect(backend.count('GET /articles/docker/related')).toBe(1))
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)))

      expect(screen.queryByText('Связанные статьи')).not.toBeInTheDocument()
    })

    it('says so for an unknown article', async () => {
      await renderWiki('/wiki/missing', samples)

      expect(screen.getByRole('heading', { name: 'Статья не найдена' })).toBeInTheDocument()
    })
  })

  describe('creating', () => {
    it('saves a new article and opens it', async () => {
      const { user, router } = await renderWiki('/wiki/new')

      await user.type(screen.getByLabelText('Название'), '  Мой гайд  ')
      await user.type(screen.getByLabelText('Краткое описание'), 'Как играть')
      await user.type(screen.getByLabelText('Теги'), '#Games{Enter}Guides, minecraft')
      await user.click(screen.getByLabelText('Содержимое'))
      await user.paste('# Старт\n\nСобери **дерево**.')
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'Мой гайд' })).toBeInTheDocument()
      const [saved] = stored()
      expect(saved).toMatchObject({
        title: 'Мой гайд',
        description: 'Как играть',
        content: '# Старт\n\nСобери **дерево**.',
        tags: ['games', 'guides', 'minecraft'],
      })
      expect(saved.id).toBeTruthy()
      expect(saved.createdAt).toBe(saved.updatedAt)
      expect(router.state.location.pathname).toBe(`/wiki/${saved.id}`)
      expect(screen.getByText('дерево').tagName).toBe('STRONG')
    })

    it('requires a title', async () => {
      const { user, router } = await renderWiki('/wiki/new')

      await user.type(screen.getByLabelText('Название'), '   ')
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Введите название')
      expect(screen.getByLabelText('Название')).toHaveFocus()
      expect(router.state.location.pathname).toBe('/wiki/new')
      expect(stored()).toHaveLength(0)
    })

    it('lets the user remove a tag and ignores duplicates', async () => {
      const { user } = await renderWiki('/wiki/new')
      const tags = screen.getByLabelText('Теги')

      await user.type(tags, 'react{Enter}#React{Enter}hooks{Enter}')
      expect(screen.getAllByText(/^#/).map((tag) => tag.textContent)).toEqual(['#react', '#hooks'])

      await user.click(screen.getByRole('button', { name: 'Убрать тег react' }))
      expect(screen.queryByText('#react')).not.toBeInTheDocument()

      await user.type(tags, '{Backspace}')
      expect(screen.queryByText('#hooks')).not.toBeInTheDocument()
    })

    it('cancels without saving', async () => {
      const { user, router } = await renderWiki('/wiki/new', samples)

      await user.type(screen.getByLabelText('Название'), 'Черновик')
      await user.click(screen.getByRole('link', { name: 'Отмена' }))

      expect(router.state.location.pathname).toBe('/wiki')
      expect(stored()).toHaveLength(3)
    })
  })

  describe('markdown preview', () => {
    it('switches between the editor and the preview with tabs on narrow screens', async () => {
      const { user } = await renderWiki('/wiki/new')
      await user.click(screen.getByLabelText('Содержимое'))
      await user.paste('## Раздел\n\nТекст с *акцентом*')

      expect(screen.getByRole('tab', { name: 'Редактор' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.queryByRole('heading', { name: 'Раздел' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: 'Предпросмотр' }))
      expect(screen.getByRole('heading', { level: 3, name: 'Раздел' })).toBeInTheDocument()
      expect(screen.getByText('акцентом').tagName).toBe('EM')
      expect(screen.queryByLabelText('Содержимое')).not.toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: 'Редактор' }))
      expect(screen.getByLabelText('Содержимое')).toHaveValue('## Раздел\n\nТекст с *акцентом*')
    })

    it('hints at an empty preview', async () => {
      const { user } = await renderWiki('/wiki/new')

      await user.click(screen.getByRole('tab', { name: 'Предпросмотр' }))

      expect(screen.getByText('Здесь появится предпросмотр статьи.')).toBeInTheDocument()
    })

    it('shows editor and live preview side by side on desktop', async () => {
      mockDesktop()
      const { user } = await renderWiki('/wiki/new')

      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      await user.click(screen.getByLabelText('Содержимое'))
      await user.paste('# Привет')

      const preview = screen.getByRole('region', { name: 'Предпросмотр' })
      expect(within(preview).getByRole('heading', { level: 2, name: 'Привет' })).toBeInTheDocument()

      await user.type(screen.getByLabelText('Содержимое'), '!')
      expect(
        within(preview).getByRole('heading', { level: 2, name: 'Привет!' }),
      ).toBeInTheDocument()
    })
  })

  describe('editing', () => {
    it('opens the form with the current values and saves the changes', async () => {
      const { user, router } = await renderWiki('/wiki/react/edit', samples)

      expect(screen.getByRole('heading', { name: 'Редактирование статьи' })).toBeInTheDocument()
      const title = screen.getByLabelText('Название')
      expect(title).toHaveValue('React')
      expect(screen.getByLabelText('Краткое описание')).toHaveValue('Основные концепции React')
      expect(screen.getByLabelText('Содержимое')).toHaveValue(react.content)
      expect(screen.getByText('#frontend')).toBeInTheDocument()

      await user.clear(title)
      await user.type(title, 'React 19')
      await user.clear(screen.getByLabelText('Краткое описание'))
      await user.click(screen.getByRole('button', { name: 'Убрать тег frontend' }))
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'React 19' })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/wiki/react')
      expect(screen.queryByText('Основные концепции React')).not.toBeInTheDocument()

      const saved = stored().find((item) => item.id === 'react')!
      expect(saved).toMatchObject({ title: 'React 19', tags: ['javascript'] })
      expect(saved.description).toBeUndefined()
      expect(saved.createdAt).toBe(react.createdAt)
      expect(saved.updatedAt > react.updatedAt).toBe(true)
      expect(stored()).toHaveLength(3)
      expect(backend.requests).toContain('PATCH /articles/react')
    })

    it('says so when the article to edit does not exist', async () => {
      await renderWiki('/wiki/missing/edit', samples)

      expect(screen.getByRole('heading', { name: 'Статья не найдена' })).toBeInTheDocument()
    })
  })

  describe('deleting', () => {
    it('asks for confirmation, then deletes the article', async () => {
      const { user, router } = await renderWiki('/wiki/docker', samples)
      await user.click(screen.getByRole('button', { name: 'Удалить' }))

      const dialog = screen.getByRole('dialog', { name: 'Удалить статью?' })
      expect(
        within(dialog).getByText('После удаления восстановить её будет невозможно.'),
      ).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'Wiki' })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/wiki')
      expect(stored().map((item) => item.id)).toEqual(['react', 'typescript'])
      expect(screen.queryByText('Docker')).not.toBeInTheDocument()
    })

    it('keeps the article when the confirmation is cancelled', async () => {
      const { user, router } = await renderWiki('/wiki/docker', samples)
      await user.click(screen.getByRole('button', { name: 'Удалить' }))
      await user.click(
        within(screen.getByRole('dialog', { name: 'Удалить статью?' })).getByRole('button', {
          name: 'Отмена',
        }),
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/wiki/docker')
      expect(stored()).toHaveLength(3)
    })

    it('shows the empty state after the last article is deleted', async () => {
      const { user } = await renderWiki('/wiki/docker', [docker])
      await user.click(screen.getByRole('button', { name: 'Удалить' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить' }))

      expect(await screen.findByText('Ваша Wiki пока пуста')).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('shows a sidebar on desktop with tag counts, quick search and a create link', async () => {
      mockDesktop()
      const { user, router } = await renderWiki('/wiki/react', samples)
      const sidebar = screen.getByRole('navigation', { name: 'Навигация по Wiki' })

      expect(await within(sidebar).findByRole('link', { name: /#devops/ })).toHaveTextContent('1')
      expect(within(sidebar).getByRole('link', { name: /Все статьи/ })).toHaveTextContent('3')
      expect(within(sidebar).getByRole('link', { name: /#javascript/ })).toHaveTextContent('2')
      expect(within(sidebar).getByRole('link', { name: /Создать статью/ })).toHaveAttribute(
        'href',
        '/wiki/new',
      )

      await user.type(within(sidebar).getByRole('searchbox', { name: 'Быстрый поиск' }), 'docker')
      expect(router.state.location.pathname).toBe('/wiki')
      await expectCards(['Docker'])

      await user.click(within(sidebar).getByRole('link', { name: /#frontend/ }))
      expect(router.state.location.pathname).toBe('/wiki/tags/frontend')
    })

    it('uses a slide-out menu on narrow screens', async () => {
      const { user, router } = await renderWiki('/wiki/react', samples)
      expect(
        screen.queryByRole('navigation', { name: 'Навигация по Wiki' }),
      ).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Открыть меню Wiki' }))
      const menu = screen.getByRole('dialog', { name: 'Навигация по Wiki' })
      await user.click(await within(menu).findByRole('link', { name: /#devops/ }))

      expect(router.state.location.pathname).toBe('/wiki/tags/devops')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('keeps the wiki reachable from the main navigation', async () => {
      await renderWiki('/wiki', samples)

      expect(screen.getByRole('link', { name: 'Wiki', current: 'page' })).toHaveAttribute(
        'href',
        '/wiki',
      )
    })
  })

  describe('when the backend is unavailable', () => {
    it('says so on the wiki pages, with a retry that brings the wiki back', async () => {
      backend.seedArticles(samples)
      backend.offline = true
      const router = createMemoryRouter(routes, { initialEntries: ['/wiki'] })
      const user = userEvent.setup()
      render(<RouterProvider router={router} />)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('Не удаётся связаться с сервером')

      backend.offline = false
      await user.click(within(alert).getByRole('button', { name: 'Повторить' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'Wiki' })).toBeInTheDocument()
      expect(await screen.findAllByRole('heading', { level: 3 })).toHaveLength(3)
    })

    it('keeps what the user typed when saving an article fails', async () => {
      const { user, router } = await renderWiki('/wiki/new')
      await user.type(screen.getByLabelText('Название'), 'Важная статья')

      backend.offline = true
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Не удаётся связаться')
      expect(screen.getByLabelText('Название')).toHaveValue('Важная статья')
      expect(router.state.location.pathname).toBe('/wiki/new')

      backend.offline = false
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Важная статья' }),
      ).toBeInTheDocument()
    })
  })
})
