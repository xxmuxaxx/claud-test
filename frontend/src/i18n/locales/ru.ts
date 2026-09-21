const ru = {
  nav: {
    home: 'Главная',
    tasks: 'Список дел',
    about: 'О проекте',
    wiki: 'Wiki',
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
  errors: {
    network: 'Не удаётся связаться с сервером. Проверьте, что backend запущен.',
    validation: 'Сервер не принял данные: возможно, какой-то текст слишком длинный.',
    generic: 'Что-то пошло не так. Попробуйте ещё раз.',
    retry: 'Повторить',
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
  wiki: {
    title: 'Wiki',
    tagline: 'Ваша личная база знаний',
    create: 'Создать статью',
    stats: 'Статей: {{articles}} · Тегов: {{tags}}',
    navLabel: 'Навигация по Wiki',
    openMenu: 'Открыть меню Wiki',
    closeMenu: 'Закрыть меню',
    search: {
      placeholder: 'Поиск по статьям...',
      label: 'Поиск по статьям',
      sidebarPlaceholder: 'Поиск',
      sidebarLabel: 'Быстрый поиск',
    },
    nothingFound: 'Ничего не найдено',
    empty: {
      title: 'Ваша Wiki пока пуста',
      hint: 'Создайте первую статью и начните собирать свою базу знаний.',
    },
    allArticles: 'Все статьи',
    results: 'Результаты',
    tags: 'Теги',
    tagFilter: 'Фильтр по тегам',
    allTags: 'Все',
    recentlyUpdated: 'Недавно изменённые',
    recentlyCreated: 'Недавно созданные',
    updated: 'Обновлено: {{date}}',
    created: 'Создано: {{date}}',
    modified: 'Изменено: {{date}}',
    tag: {
      heading: 'Тег #{{tag}}',
      empty: 'Статей с этим тегом нет.',
      back: 'Все статьи',
    },
    article: {
      edit: 'Редактировать',
      delete: 'Удалить',
      related: 'Связанные статьи',
      notFound: {
        title: 'Статья не найдена',
        hint: 'Возможно, она была удалена.',
      },
    },
    delete: {
      title: 'Удалить статью?',
      description: 'После удаления восстановить её будет невозможно.',
      confirm: 'Удалить',
    },
    editor: {
      createTitle: 'Новая статья',
      editTitle: 'Редактирование статьи',
      titleField: 'Название',
      titleRequired: 'Введите название',
      descriptionField: 'Краткое описание',
      descriptionHint: 'Необязательно. Показывается в списке статей.',
      tagsField: 'Теги',
      tagsPlaceholder: 'Введите тег и нажмите Enter',
      removeTag: 'Убрать тег {{tag}}',
      contentField: 'Содержимое',
      contentPlaceholder: '# Заголовок\n\nПишите в **Markdown**: списки, ссылки, `код`, цитаты…',
      write: 'Редактор',
      preview: 'Предпросмотр',
      previewEmpty: 'Здесь появится предпросмотр статьи.',
      save: 'Сохранить',
    },
  },
}

export type Translation = typeof ru

export default ru
