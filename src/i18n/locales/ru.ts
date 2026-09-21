const ru = {
  nav: {
    home: 'Главная',
    tasks: 'Список дел',
    about: 'О проекте',
  },
  language: {
    label: 'Язык',
  },
  home: {
    title: 'Добро пожаловать',
    intro:
      'Стартовый проект: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + Zustand. Отредактируйте <code>src/pages/HomePage.tsx</code> и сохраните, чтобы увидеть горячую перезагрузку.',
  },
  about: {
    title: 'О проекте',
    body: 'Этот стартовый проект построен на Vite для быстрой сборки и HMR, TypeScript для типобезопасности, Tailwind CSS для стилизации, React Router для навигации, Zustand для управления состоянием и Vitest + Testing Library для тестов.',
  },
  notFound: {
    message: 'Страница не найдена.',
    back: 'Вернуться на главную',
  },
  counter: {
    increment: 'Увеличить',
    decrement: 'Уменьшить',
    reset: 'Сбросить',
  },
  common: {
    cancel: 'Отмена',
  },
  priority: {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  },
  tasks: {
    title: 'Список дел',
    stats: 'Выполнено: {{completed}} · Осталось: {{active}}',
    add: 'Добавить дело',
    empty: {
      title: 'Пока нет дел',
      hint: 'Создайте первое дело, чтобы начать.',
    },
    nothingFound: 'Ничего не найдено',
    item: {
      due: 'Срок: {{date}}',
      overdue: 'Просрочено',
      edit: 'Редактировать: {{title}}',
      delete: 'Удалить: {{title}}',
    },
    toolbar: {
      searchPlaceholder: 'Поиск дел...',
      searchLabel: 'Поиск дел',
      statusLabel: 'Статус',
      status: {
        all: 'Все',
        active: 'Активные',
        completed: 'Выполненные',
      },
      priorityLabel: 'Фильтр по приоритету',
      allPriorities: 'Все приоритеты',
      sortLabel: 'Сортировка',
      sort: {
        newest: 'Новые сначала',
        oldest: 'Старые сначала',
        priority: 'По приоритету',
        dueDate: 'По сроку выполнения',
      },
    },
    form: {
      createTitle: 'Новое дело',
      editTitle: 'Редактирование дела',
      titleField: 'Название',
      descriptionField: 'Описание',
      priorityField: 'Приоритет',
      dueDateField: 'Дата выполнения',
      titleRequired: 'Введите название',
      create: 'Создать',
      save: 'Сохранить',
    },
    delete: {
      title: 'Удалить дело?',
      subject: '«{{title}}»',
      confirm: 'Удалить',
    },
  },
}

export type Translation = typeof ru

export default ru
