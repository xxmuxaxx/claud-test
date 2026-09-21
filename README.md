# Modern React App

Личный органайзер: **список дел** и **Wiki** (статьи в Markdown с тегами и поиском).

```
frontend/            React 19 + Vite + TypeScript + Tailwind v4 (см. frontend/README.md)
backend/             REST API: Fastify + Prisma + PostgreSQL (см. backend/README.md)
docker-compose.yml   PostgreSQL + backend + frontend одной командой
package.json         только удобные скрипты; у frontend и backend свои package.json и node_modules
```

## Запуск

### Всё в Docker

```bash
docker compose up --build
```

Откройте <http://localhost:5173>. API — <http://localhost:3000/api/v1>, Swagger — <http://localhost:3000/api/docs>.
Миграции применяются автоматически, пустая БД заполняется демо-данными. Порты и пароль БД можно поменять
через `.env` (шаблон — `.env.example`).

### Для разработки

```bash
npm run install:all      # зависимости обоих проектов

# backend + PostgreSQL (вариант без Docker, см. backend/README.md):
cd backend && cp .env.example .env
npm run db:embedded      # PostgreSQL — оставьте в отдельном терминале
npm run db:migrate && npm run db:seed && npm run dev

# frontend (из корня репозитория):
npm run dev              # http://localhost:5173
```

Если Docker есть, вместо `db:embedded` можно поднять только базу и backend:
`docker compose up db backend`.

## Проверки

```bash
npm run check   # typecheck + lint + format:check + tests для frontend и backend
npm run build   # production-сборка обоих проектов
```
