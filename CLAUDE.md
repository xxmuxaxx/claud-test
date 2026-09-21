# Nook

React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router 8 + Zustand. Sections: `/tasks` (to-do list), `/wiki` (personal Markdown wiki), `/games` (games: Snake at `/games/snake`, 2048 at `/games/2048`). `/` redirects to `/tasks`. Repo layout: `frontend/` (React app, own `package.json`), `backend/` (Fastify + Prisma REST API, own `package.json`; see `backend/README.md`), and the shared `docker-compose.yml` at the root. Tasks and Wiki data live in PostgreSQL behind the API. Paths like `src/...` below are relative to `frontend/`. The user communicates in Russian.

## Commands

Frontend (`cd frontend`):

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run dev`          | dev server (port 5173)           |
| `npm test`             | Vitest, single run               |
| `npm run typecheck`    | `tsc -b --noEmit`                |
| `npm run lint`         | ESLint                           |
| `npm run format:check` | Prettier check (`format` to fix) |
| `npm run build`        | typecheck + production build     |

Backend (`cd backend`, own `package.json`): `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:migrate|db:seed|db:embedded`. `docker compose up --build` (root) runs PostgreSQL + backend + frontend (nginx, http://localhost:5173). Root `package.json` only has convenience scripts (`npm run dev`, `npm run check` = every check of both projects); there is no shared `node_modules`.

Before committing, `typecheck`, `lint`, `format:check` and `test` must pass in both `frontend/` and `backend/` (both use the shared root `.prettierrc.json`); `npm run check` at the root runs all of them.

## Conventions

- `@/*` is an alias for `src/*`. Prettier: no semicolons, single quotes, 100 columns.
- `cn()` (`src/lib/cn.ts`) is `clsx` + `tailwind-merge`: conflicting Tailwind utilities resolve to the last one, so a `className` prop can override a component's defaults.
- UI kit (shadcn/ui style: `class-variance-authority` + `clsx` + `tailwind-merge`, components live in `src/components/ui`, no CLI and no CSS-variable theme — the light look is the plain utilities, dark mode is the `dark:` variant, which `@custom-variant` in `index.css` ties to a `dark` class on `<html>`). `Button` (`variant`, `loading`), `buttonClass()` for links that look like buttons, `Modal`, `Skeleton`, `Spinner`, `LoadingRegion`. Add new primitives there, by hand.
- Business logic lives in `src/lib` (pure, unit-tested) and `src/store`; components stay thin.

## Data & API layer

- Layers: UI → Zustand store / data hooks → `src/api/*` (`tasksApi`, `articlesApi`, `tagsApi`) → `src/api/http.ts` (the only `fetch`). Components never call `fetch` or `src/api` directly. Backend URL: `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`; baked in at build time, a build arg in `frontend/Dockerfile`); the backend's `CORS_ORIGIN` must contain the frontend origin.
- Search, filters and sorting are done by the backend, never in the browser. Typing is debounced (`useDebouncedValue`, 250 ms). The API layer maps the wire format to the frontend models (`null` → `undefined`); the frontend `Task` has no timestamps.
- Loading states: never render `null` while waiting. First load → a skeleton wrapped in `LoadingRegion` (`role=status`, announces `common.loading`; see `TasksSkeleton`, `WikiSkeletons`). A refetch that keeps the old data on screen (search, filters) → `aria-busy` + dimming (`aria-busy:opacity-60`). A write in flight → `<Button loading>` (spinner, disabled, `aria-busy`).
- Errors are `ApiError` (`status`, `code`; `status 0` = server unreachable). Show them with `<ErrorNotice>` (`errors.*` i18n keys); failed writes keep the form/dialog open.
- Tests never hit a network: `src/test/setup.ts` installs `fetch` = the in-memory `backend` from `src/test/fakeBackend.ts`, which mirrors the real API contract (seed with `backend.seedTasks/seedArticles`, inspect `backend.tasks/articles/requests`, simulate an outage with `backend.offline = true`). If the real API changes, change the fake too; the real API is covered by `backend/test`.
- `localStorage` is used only for the UI language (`app.language`), the theme (`app.theme`) and game high scores (`games.<game>.highScore`). Old `tasks` / `wiki_articles` keys from the pre-backend version are ignored, not migrated.

## Tasks (`/tasks`)

- `useTasksStore` holds the list for the current view (`tasks`), the counters over all tasks (`stats`, from `GET /tasks/stats`) and `status`. `load(view)` sends the toolbar state (`toTaskQuery`) to the backend; every change reloads the list, so filters/order stay right. Only the newest `load` may write to the store (stale responses are dropped).

## Wiki (`/wiki`)

- Routes: `/wiki`, `/wiki/new`, `/wiki/:articleId`, `/wiki/:articleId/edit`, `/wiki/tags/:tag` (see `src/router`; `routes` is exported so tests can render the real tree in a memory router).
- `useWikiStore` keeps only wiki-wide numbers (`tags` with counts, `total`) for the sidebar/stats/empty state, plus the write actions (which refresh those numbers). Article lists and single articles are fetched per page by `hooks/useArticles` (`useArticleList`, `useArticle`, `useRelatedArticles`) on top of `useAsyncData`, so search never needs the whole wiki in the browser. The backend assigns `id`/`createdAt`/`updatedAt`; `update` replaces all editable fields. Pure helpers (tag normalization, excerpts, sorting of the loaded list) are in `src/lib/wiki.ts`.
- The wide container is opted into per route with `handle: { wide: true }` (read by `Layout`).
- Sidebar (desktop) vs. slide-out menu and split vs. tabbed editor are chosen in JS by `useIsDesktop` (matchMedia, `lg` = 1024px), not CSS, so only one variant is in the DOM. jsdom has no `matchMedia`, so tests get the narrow layout; stub `matchMedia` for desktop (see `WikiPages.test.tsx`).
- Markdown is rendered by `MarkdownView` (react-markdown + remark-gfm; raw HTML is not rendered). The article title is the page `<h1>`, so Markdown headings are shifted one level down (`#` → `<h2>`) and styled by the `.wiki-h1..6` classes in `index.css`, not by tag. Tags are stored normalized (lowercase, no `#`).

## Games (`/games`)

- Fully client-side (no API, no store): a game's state is a `useReducer` in a hook. Snake rules are pure functions in `src/lib/snake.ts` (randomness is passed in; unit-tested in `snake.test.ts`); `hooks/useSnakeGame` runs the `setInterval` loop, `hooks/useSnakeKeyboard` maps arrows / W-A-S-D (by `event.code`, so any layout) and Space/P; `hooks/useHighScore(key, score)` keeps the record in `localStorage` (safe when storage is blocked). The board is plain DOM (segments positioned in %), no canvas.
- 2048: rules are pure functions in `src/lib/game2048.ts` (a move draws two random numbers — cell, then 2/4 — passed in via `random`; `random() = 0` spawns a 2 on the first free cell). The state is a list of `Tile`s with stable ids (`toBoard` derives the plain grid for the rules): a slide keeps a tile's id, a merge makes a new tile (`merged`) and keeps the two originals as `consumed` under it until the next move, a spawn is `isNew`. That is what animates: `Game2048Board` positions each tile with a CSS `transform` transition (100 ms) and new/merged tiles pop in after it via `--animate-tile-*` in `index.css` (`motion-reduce` disables both). `hooks/useGame2048` is a plain reducer (turn-based, no timer; randomness arrives in the action), `useGame2048Keyboard` maps arrows / W-A-S-D, and the board also reads touch swipes via `swipeDirection`. After reaching 2048 the game offers "continue" once (`continued`). Key helpers shared with Snake live in `lib/keyboard.ts`.
- Catalog: `pages/games/catalog.ts` (`games: GameDefinition[]`, see `types/game.ts`) drives both the `/games` cards and the routes (`/games/:id`). To add a game: logic in `lib/`, components in `components/games/`, a page in `pages/games/`, one catalog entry, and `games.<id>.*` i18n keys. Shared pieces: `GamePageLayout` (back link + title), `ScoreBoard`, `GameCard`.
- Component tests use fake timers and `Math.random` mocked to `0` (first food lands on the top-left cell); keys are dispatched on `window`.

## Theme

- Three modes: `system` (default, follows `prefers-color-scheme` live), `light`, `dark`. Pure logic in `src/lib/theme.ts` (`applyTheme` toggles the `dark` class on `<html>`), state in `useThemeStore` (`initTheme()` in `main.tsx` applies it and watches the OS), UI in `ThemeSwitcher` (a `<select>` in the Navbar next to `LanguageSwitcher`). An inline script in `index.html` sets the class before the first paint — keep it in sync with `lib/theme.ts`. New components need `dark:` variants as before; never use `@media (prefers-color-scheme)` directly.
- Navbar now has two `<select>`s, so tests must scope option queries with `within(combobox)`.

## i18n (ru / en / ka)

- Every user-visible string goes through `t()` (`react-i18next`); never hardcode UI text. Brand name "Nook" is intentionally not translated.
- Dictionaries: `src/i18n/locales/{ru,en,ka}.ts`. `ru.ts` defines the key structure; `en`/`ka` are typed against it. A new key must be added to **all three**. Placeholders (`{{name}}`) and tags (`<code>`) must match across locales — `locales.test.ts` enforces this.
- Don't store translated strings in state; store the condition/key and translate at render, so a language switch updates the UI.
- Dates and numbers: use `Intl` with `i18n.language` (see `formatDueDate`), not a hardcoded locale.
- Adding a language: new `locales/xx.ts`, register it in `src/i18n/index.ts` and `LANGUAGES`.
- Georgian copy was machine-written and has not been reviewed by a native speaker.
- Tests pin the language to `ru` in `src/test/setup.ts`, so tests assert on Russian text. Tests that switch language must not rely on it persisting (setup resets it before each test).

## Git / environment

- Work in feature branches (`feature/...`, `chore/...`); merge into `main` fast-forward. Commit and push only when asked. The remote `origin` is `https://github.com/xxmuxaxx/claud-test.git` (HTTPS: the machine's SSH key isn't registered on GitHub, and the sandboxed session has no GitHub credentials, so the user pushes from their own terminal).
- Line endings: `.gitattributes` forces LF in the repo and the working tree (Prettier expects LF), overriding the global `core.autocrlf=true`. If `git status` still lists many files as modified with an empty diff, it is stale stat data or leftover CRLF from before this rule — run `git update-index -q --refresh` and check `git diff --stat` before assuming files changed.
- Git can briefly hold `.git/index.lock` because the desktop app polls the repo; retry before deleting anything.
- The built-in preview browser lacks Georgian ICU data, so `Intl` dates render in Russian there. Verify Georgian dates in Node or a regular browser.
