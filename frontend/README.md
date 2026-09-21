# Nook

Стартовый шаблон на современном стеке:

- **[Vite](https://vite.dev)** — сборка и дев-сервер
- **[React 19](https://react.dev)** + **TypeScript**
- **[Tailwind CSS v4](https://tailwindcss.com)** — CSS-first конфигурация через `@theme` (см. `src/index.css`), без `tailwind.config.js`
- **[React Router v8](https://reactrouter.com)** — роутинг через `createBrowserRouter`
- **[Zustand](https://zustand.docs.pmnd.rs)** — стейт-менеджмент (пример: `src/store/useTasksStore.ts`)
- **ESLint 10** (flat config) + **Prettier** — линт и форматирование
- **Vitest** + **Testing Library** — юнит- и компонентные тесты

## Структура

```
src/
  api/          HTTP-слой (tasksApi, articlesApi, tagsApi) — единственное место с fetch
  components/   переиспользуемые UI-компоненты
  hooks/        хуки (загрузка данных, debounce, media query)
  pages/        компоненты страниц (роуты)
  router/       конфигурация React Router
  store/        Zustand-сторы
  lib/          небольшие утилиты
  test/         настройка тестового окружения (в т. ч. in-memory «backend» для тестов)
```

## Данные и backend

Задачи и статьи Wiki хранятся в PostgreSQL и доступны через REST API из соседней папки
[`../backend`](../backend/README.md) (`/api/v1`, Swagger — `/api/docs`). Запуск всего проекта — в
[корневом README](../README.md).

Адрес API задаётся переменной `VITE_API_BASE_URL` (по умолчанию `http://localhost:3000/api/v1`; см.
`.env.example`), а origin frontend — переменной `CORS_ORIGIN` на стороне backend. В Docker frontend
собирается в статику и раздаётся nginx (`Dockerfile`, `nginx.conf`).

## Локализация (i18n)

Интерфейс переведён на русский (`ru`), английский (`en`) и грузинский (`ka`) через
**[i18next](https://www.i18next.com)** + **react-i18next**.

- Словари: `src/i18n/locales/{ru,en,ka}.ts`. `ru.ts` задаёт структуру ключей, `en`/`ka`
  типизированы под неё — пропущенный ключ не пройдёт `npm run typecheck`, а тест
  `locales.test.ts` дополнительно сверяет плейсхолдеры `{{…}}` и теги в строках.
- Ключи в `t('…')` проверяются типами (`src/i18n/i18next.d.ts`).
- Язык определяется по `localStorage` (`app.language`), затем по языку браузера; если он не
  поддерживается — английский. Переключатель находится в шапке; выбор сохраняется, а
  `<html lang>` обновляется автоматически.
- Даты форматируются через `Intl` с текущей локалью (`formatDueDate(iso, locale)`).
- Чтобы добавить язык: создайте `src/i18n/locales/xx.ts`, подключите его в `src/i18n/index.ts`
  и добавьте в `LANGUAGES`.

## Установка

Пакеты не установлены — зависимости нужно подтянуть один раз командой ниже
(это единственный шаг, требующий обычного терминала с доступом в интернет,
а не среды Claude, у которой доступ к npm registry ограничен политикой сети):

```bash
npm install
```

## Скрипты

| Команда                | Назначение                              |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | дев-сервер с HMR                        |
| `npm run build`        | проверка типов + продакшен-сборка       |
| `npm run preview`      | локальный предпросмотр собранного билда |
| `npm run lint`         | проверка ESLint                         |
| `npm run lint:fix`     | автофикс ESLint                         |
| `npm run format`       | форматирование Prettier                 |
| `npm run format:check` | проверка форматирования без изменений   |
| `npm run typecheck`    | только проверка типов TypeScript        |
| `npm run test`         | запуск тестов Vitest один раз           |
| `npm run test:watch`   | тесты в watch-режиме                    |

## Алиас путей

`@/*` указывает на `src/*` (настроено в `vite.config.ts` и `tsconfig.app.json`), например:

```ts
import { Button } from '@/components/ui/Button'
```
