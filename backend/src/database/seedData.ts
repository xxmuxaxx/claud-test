import type { PrismaClient } from './prisma.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** A calendar date `days` from `now` (negative = in the past), as a `date` column value. */
function dateFromNow(now: Date, days: number): Date {
  const date = new Date(now.getTime() + days * DAY_MS)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** Due dates are relative to today, so overdue / upcoming tasks always show up in the demo. */
const tasks = (now: Date) => [
  {
    title: 'Изучить React',
    description: 'Разобраться с хуками: useState, useEffect, useMemo.',
    priority: 'high' as const,
    dueDate: dateFromNow(now, 3),
    completed: false,
  },
  {
    title: 'Настроить Docker Compose',
    description: 'PostgreSQL и backend одной командой.',
    priority: 'high' as const,
    dueDate: dateFromNow(now, -2),
    completed: false,
  },
  {
    title: 'Написать тесты для API',
    priority: 'medium' as const,
    dueDate: dateFromNow(now, 7),
    completed: false,
  },
  {
    title: 'Прочитать документацию TypeScript',
    description: 'Раздел про дженерики и утилитарные типы.',
    priority: 'medium' as const,
    dueDate: null,
    completed: false,
  },
  {
    title: 'Разобрать почту',
    priority: 'low' as const,
    dueDate: null,
    completed: true,
  },
  {
    title: 'Обновить зависимости',
    description: 'npm outdated, затем обновить минорные версии.',
    priority: 'low' as const,
    dueDate: dateFromNow(now, -5),
    completed: true,
  },
]

const articles = [
  {
    title: 'React',
    description: 'Основы React: компоненты, состояние и хуки.',
    tags: ['frontend', 'javascript', 'programming'],
    content: `# React

React — библиотека для построения пользовательских интерфейсов из **компонентов**.

## Компонент

Компонент — это функция, которая возвращает разметку:

\`\`\`tsx
function Greeting({ name }: { name: string }) {
  return <h1>Привет, {name}!</h1>
}
\`\`\`

## Хуки

- \`useState\` — локальное состояние;
- \`useEffect\` — побочные эффекты (запросы, подписки);
- \`useMemo\` — кэш вычислений.

> Хуки можно вызывать только на верхнем уровне компонента.
`,
  },
  {
    title: 'TypeScript',
    description: 'Статическая типизация поверх JavaScript.',
    tags: ['javascript', 'programming'],
    content: `# TypeScript

TypeScript добавляет к JavaScript **систему типов**, которая проверяется при сборке.

## Пример

\`\`\`ts
interface User {
  id: string
  name: string
  email?: string
}

const greet = (user: User) => \`Привет, \${user.name}\`
\`\`\`

## Полезные утилитарные типы

| Тип | Что делает |
| --- | --- |
| \`Partial<T>\` | все поля необязательные |
| \`Pick<T, K>\` | оставляет выбранные поля |
| \`Omit<T, K>\` | убирает выбранные поля |

С React он дружит «из коробки».
`,
  },
  {
    title: 'Docker',
    description: 'Контейнеры: образы, тома и Docker Compose.',
    tags: ['devops'],
    content: `# Docker

Docker упаковывает приложение вместе с окружением в **контейнер**.

## Основные команды

\`\`\`bash
docker build -t app .
docker run -p 3000:3000 app
docker compose up
\`\`\`

## Compose

\`docker-compose.yml\` описывает несколько сервисов сразу — например, backend и PostgreSQL.
Данные базы хранятся в **томе** (volume), поэтому переживают пересоздание контейнера.
`,
  },
  {
    title: 'Git',
    description: 'Система контроля версий: ветки, коммиты, слияния.',
    tags: ['devops', 'programming'],
    content: `# Git

Git хранит историю изменений проекта в виде цепочки **коммитов**.

## Ежедневный цикл

\`\`\`bash
git switch -c feature/login
git add .
git commit -m "Add login form"
git switch main
git merge --ff-only feature/login
\`\`\`

## Советы

1. Делайте маленькие коммиты с понятными сообщениями.
2. Работайте в отдельных ветках.
3. Перед слиянием смотрите \`git diff\`.
`,
  },
]

/**
 * Fills empty tables with demo data. A table that already has rows is left alone,
 * so running the seed twice (or against a database in use) never duplicates or overwrites anything.
 */
export async function seedDatabase(prisma: PrismaClient, now = new Date()) {
  const result = { tasks: 0, articles: 0 }

  if ((await prisma.task.count()) === 0) {
    // Created one by one, oldest first, so `createdAt` follows the list order.
    for (const task of tasks(now)) {
      await prisma.task.create({ data: task })
      result.tasks++
    }
  }

  if ((await prisma.article.count()) === 0) {
    for (const { tags, ...article } of articles) {
      await prisma.article.create({
        data: {
          ...article,
          tags: {
            create: tags.map((name, position) => ({
              position,
              tag: { connectOrCreate: { where: { name }, create: { name } } },
            })),
          },
        },
      })
      result.articles++
    }
  }

  return result
}
