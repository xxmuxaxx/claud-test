# Backend

REST API для разделов **To-Do** и **Wiki**. Стек: **Node.js 22 + Fastify 5 + TypeScript + Prisma 7 + PostgreSQL**,
валидация и OpenAPI — из одних и тех же **zod**-схем.

## Быстрый старт

### Docker (PostgreSQL + backend)

Из корня репозитория:

```bash
docker compose up --build
```

Контейнер backend сам применит миграции и, если БД пустая, зальёт демо-данные (`RUN_SEED=true`).
API: <http://localhost:3000/api/v1>, Swagger UI: <http://localhost:3000/api/docs>.
Затем frontend: `npm run dev` в корне (порт 5173).

### Без Docker

Нужен PostgreSQL. Если его нет, можно поднять настоящий сервер прямо из npm-пакета (данные — в `backend/.pgdata`):

```bash
cd backend
npm install
cp .env.example .env         # настройки по умолчанию подходят для локальной разработки
npm run db:embedded          # PostgreSQL на :5432 (оставьте работать в отдельном терминале)
npm run db:migrate           # миграции — одна команда
npm run db:seed              # демо-данные (пропускается, если таблицы не пустые)
npm run dev                  # http://localhost:3000, перезапуск при изменениях
```

## Команды

| Команда                              | Что делает                                                     |
| ------------------------------------ | -------------------------------------------------------------- |
| `npm run dev`                        | dev-сервер (`tsx watch`)                                       |
| `npm run build` / `npm start`        | `prisma generate` + компиляция в `dist/` / запуск собранного   |
| `npm run typecheck` / `npm run lint` | проверка типов / ESLint                                        |
| `npm test`                           | тесты на настоящем PostgreSQL (см. ниже)                       |
| `npm run db:migrate`                 | `prisma migrate deploy` — применить миграции                   |
| `npm run db:migrate:dev`             | создать новую миграцию после правки `schema.prisma` (нужна БД) |
| `npm run db:seed`                    | демо-данные                                                    |
| `npm run db:reset`                   | сбросить БД, применить миграции, засеять                       |
| `npm run db:embedded`                | локальный PostgreSQL без Docker                                |

## Настройки (`.env`)

Все настройки — переменные окружения (шаблон — `.env.example`, сам `.env` не коммитится):

| Переменная     | По умолчанию            | Назначение                                             |
| -------------- | ----------------------- | ------------------------------------------------------ |
| `PORT`         | `3000`                  | порт                                                   |
| `HOST`         | `0.0.0.0`               | адрес                                                  |
| `NODE_ENV`     | `development`           | окружение                                              |
| `DATABASE_URL` | — (обязательна)         | строка подключения PostgreSQL                          |
| `CORS_ORIGIN`  | `http://localhost:5173` | разрешённые origin frontend; несколько — через запятую |
| `LOG_LEVEL`    | `info`                  | `fatal` … `trace`, `silent`                            |

Неверная конфигурация останавливает запуск с понятным сообщением.

## Архитектура

```
backend/
├── prisma/
│   ├── schema.prisma          модели всех модулей
│   └── migrations/            SQL-миграции
├── src/
│   ├── server.ts              точка входа: конфиг → Prisma → app.listen, graceful shutdown
│   ├── app.ts                 buildApp(): CORS, Swagger, обработка ошибок, подключение модулей
│   ├── config/env.ts          валидация переменных окружения
│   ├── database/              Prisma-клиент, seed
│   ├── common/                errors/, schemas/, utils/ — то, что нужно всем модулям
│   └── modules/
│       ├── index.ts           СПИСОК МОДУЛЕЙ — единственное место, которое знает обо всех
│       ├── tasks/             routes → service → repository (+ schemas, mapper, types)
│       ├── articles/          то же
│       ├── tags/              то же (только чтение)
│       └── health/
└── test/                      тесты (Vitest + настоящий PostgreSQL)
```

Слои внутри модуля: **routes** (HTTP: схема запроса/ответа, вызов сервиса) → **service** (бизнес-правила:
нормализация, ранжирование, `NotFound`) → **repository** (единственное место, знающее про Prisma).
Модули **не импортируют друг друга**: Tasks и Articles независимы.

### Как добавить раздел (calendar, notes, bookmarks, …)

1. Добавьте модели в `prisma/schema.prisma` (без связей с моделями других модулей) и создайте миграцию
   (`npm run db:migrate:dev -- --name add_notes`).
2. Создайте `src/modules/notes/` по образцу `tasks/` и экспортируйте `AppModule` (`name`, `prefix`, `plugin`).
3. Добавьте его в массив в `src/modules/index.ts`.

Код существующих модулей менять не нужно. Раздел появится под `/api/v1/notes` и в Swagger.

### Единственное исключение: Tags ↔ Articles

Теги живут в собственной таблице и связаны со статьями через `ArticleTag` (many-to-many). Модуль `tags` только
читает эту связь; создаёт и обновляет теги модуль `articles`.

## Схема БД

```
tasks                                  articles                        tags
─────                                  ────────                        ────
id           text  PK (uuid v7)        id           text  PK           id    text  PK
title        varchar(200)              title        varchar(200)       name  varchar(50)  UNIQUE
description  varchar(2000) null        description  varchar(2000) null       ▲
completed    boolean = false           content      text                    │ many
priority     enum(low,medium,high)     createdAt    timestamptz             │
dueDate      date null                 updatedAt    timestamptz       article_tags
createdAt    timestamptz               ▲                              ──────────
updatedAt    timestamptz               └──── many ────────────────── articleId → articles (ON DELETE CASCADE)
                                                                      tagId     → tags     (ON DELETE CASCADE)
                                                                      position  int   (порядок тегов, заданный автором)
                                                                      PK (articleId, tagId)
```

- Enum `priority` объявлен в порядке `low, medium, high` — PostgreSQL сортирует enum по этому порядку,
  поэтому `sort=priority` работает средствами БД.
- Тег, который не использует ни одна статья, в `GET /tags` не попадает (теги «формируются на основе существующих статей»).
- Индексы: `tasks(completed, priority, dueDate, createdAt)`, `articles(createdAt, updatedAt)`, `article_tags(tagId)`.

## API `/api/v1`

Полное описание (параметры, тела запросов, ответы, ошибки) — в Swagger UI: `/api/docs`, спецификация — `/api/docs/json`.

| Метод и путь                | Назначение                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `GET /health`               | `{"status":"ok"}`                                                                  |
| `GET /tasks`                | список; `search`, `status` (`all\|active\|completed`), `priority`, `sort`, `order` |
| `GET /tasks/:id`            | задача                                                                             |
| `POST /tasks`               | создать (`title`, `description?`, `priority?`, `dueDate?`); `completed=false`      |
| `PATCH /tasks/:id`          | изменить любые поля, в т.ч. `completed`; `null` очищает `description`/`dueDate`    |
| `DELETE /tasks/:id`         | удалить (204)                                                                      |
| `GET /tasks/stats`          | _расширение_: `{total, active, completed}` по всем задачам                         |
| `GET /articles`             | список; `search`, `tag`, `sort`, `order`                                           |
| `GET /articles/:id`         | статья                                                                             |
| `POST /articles`            | создать (`title`, `description?`, `content`, `tags?`)                              |
| `PATCH /articles/:id`       | изменить; `tags` заменяет весь список                                              |
| `DELETE /articles/:id`      | удалить (204)                                                                      |
| `GET /articles/stats`       | _расширение_: `{total}`                                                            |
| `GET /articles/:id/related` | _расширение_: статьи с общими тегами (`limit`, по умолчанию 3)                     |
| `GET /tags`                 | используемые теги: `[{name, articleCount}]`, частые первыми                        |

«Расширения» нужны frontend, чтобы показывать счётчики и связанные статьи, не загружая все данные в браузер.

### Поиск

Выполняется в БД (`ILIKE`, регистр не важен). Запрос делится на слова, **каждое слово** должно найтись:
у задач — в `title` или `description`; у статей — в `title`, `description`, `content` или в имени тега
(`#react` находит тег `react`). Спецсимволы `%` и `_` ищутся как обычные символы.

### Сортировка

- Задачи: `createdAt` (по умолчанию, новые первыми), `updatedAt`, `dueDate`, `priority`, `title`.
  Задачи без срока при `sort=dueDate` — всегда в конце.
- Статьи: `createdAt`, `updatedAt`, `title`. Если `sort` не указан: при поиске — `relevance`
  (заголовок > теги > описание > текст), иначе `updatedAt`.
- `order`: `asc` | `desc`. По умолчанию `asc` для `title`/`dueDate`, `desc` для остальных.

### Валидация

Все входные данные проверяются zod-схемами (тело, query, params). Заголовок — 1–200 символов (пробелы по краям
обрезаются), описание — до 2000, `priority` ∈ `low|medium|high`, `dueDate` — корректная дата `YYYY-MM-DD` или `null`.
Теги статьи: массив строк (до 30, каждая до 50 символов); при сохранении нормализуются
(нижний регистр, без `#`, пробелы → `-`) и очищаются от дубликатов. `content` обязателен, но может быть пустой строкой
(редактор frontend это допускает). Пустое тело `PATCH` — ошибка.

### Ошибки

Единый формат для любых ошибок:

```json
{ "error": { "code": "TASK_NOT_FOUND", "message": "Task not found" } }
```

| Статус | `code`                                                                | Когда                                                           |
| ------ | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` (+ `details: [{path, message}]`), `BAD_REQUEST`    | неверные данные / битый JSON                                    |
| 404    | `TASK_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `ROUTE_NOT_FOUND`, `NOT_FOUND` | нет такого ресурса или маршрута                                 |
| 409    | `CONFLICT`                                                            | нарушение уникальности в БД (например, гонка при создании тега) |
| 500    | `INTERNAL_ERROR`                                                      | всё непредвиденное; детали только в логе, клиенту они не уходят |

## Тесты

```bash
npm test
```

Тесты идут через настоящий PostgreSQL: перед запуском `test/globalSetup.ts` поднимает временный сервер из пакета
`embedded-postgres` (Docker и установка PostgreSQL не нужны), применяет **реальные миграции** и после прогона
удаляет его. Чтобы использовать свою БД, задайте `TEST_DATABASE_URL` (**её содержимое будет стёрто!**).

Покрыто: CRUD, поиск, фильтры, сортировка, валидация и 404 для Tasks и Articles; список тегов и их связь
со статьями; health, CORS, OpenAPI, формат ошибок (в т. ч. 409 и 500), seed.
