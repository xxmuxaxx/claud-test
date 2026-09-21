# Modern React App

React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router 8 + Zustand. Sections: `/` (counter), `/tasks` (to-do list, localStorage), `/about`. The user communicates in Russian.

## Commands

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run dev`          | dev server (port 5173)           |
| `npm test`             | Vitest, single run               |
| `npm run typecheck`    | `tsc -b --noEmit`                |
| `npm run lint`         | ESLint                           |
| `npm run format:check` | Prettier check (`format` to fix) |
| `npm run build`        | typecheck + production build     |

Before committing, `typecheck`, `lint`, `format:check` and `test` must all pass.

## Conventions

- `@/*` is an alias for `src/*`. Prettier: no semicolons, single quotes, 100 columns.
- `cn()` (`src/lib/cn.ts`) only joins class names — it does **not** resolve conflicting Tailwind classes (no `tailwind-merge`). Don't pass two utilities for the same property expecting the last one to win.
- Business logic lives in `src/lib` (pure, unit-tested) and `src/store`; components stay thin. The store and UI depend only on the `TaskRepository` interface in `src/services/taskRepository.ts` (currently backed by localStorage; swap the exported `taskRepository` to change the backend).

## i18n (ru / en / ka)

- Every user-visible string goes through `t()` (`react-i18next`); never hardcode UI text. Brand name "Modern React App" is intentionally not translated.
- Dictionaries: `src/i18n/locales/{ru,en,ka}.ts`. `ru.ts` defines the key structure; `en`/`ka` are typed against it. A new key must be added to **all three**. Placeholders (`{{name}}`) and tags (`<code>`) must match across locales — `locales.test.ts` enforces this.
- Don't store translated strings in state; store the condition/key and translate at render, so a language switch updates the UI.
- Dates and numbers: use `Intl` with `i18n.language` (see `formatDueDate`), not a hardcoded locale.
- Adding a language: new `locales/xx.ts`, register it in `src/i18n/index.ts` and `LANGUAGES`.
- Georgian copy was machine-written and has not been reviewed by a native speaker.
- Tests pin the language to `ru` in `src/test/setup.ts`, so tests assert on Russian text. Tests that switch language must not rely on it persisting (setup resets it before each test).

## Git / environment

- Work in feature branches (`feature/...`, `chore/...`); merge into `main` fast-forward. There is no remote. Commit only when asked.
- Line endings: `.gitattributes` forces LF in the repo and the working tree (Prettier expects LF), overriding the global `core.autocrlf=true`. If `git status` still lists many files as modified with an empty diff, it is stale stat data or leftover CRLF from before this rule — run `git update-index -q --refresh` and check `git diff --stat` before assuming files changed.
- Git can briefly hold `.git/index.lock` because the desktop app polls the repo; retry before deleting anything.
- The built-in preview browser lacks Georgian ICU data, so `Intl` dates render in Russian there. Verify Georgian dates in Node or a regular browser.
