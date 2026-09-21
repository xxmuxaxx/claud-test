import type { Translation } from './ru'

const en: Translation = {
  nav: {
    home: 'Home',
    tasks: 'To-do list',
    about: 'About',
    wiki: 'Wiki',
  },
  language: {
    label: 'Language',
  },
  home: {
    title: 'Welcome',
    intro:
      'Starter project: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + Zustand. Edit <code>src/pages/HomePage.tsx</code> and save to see hot reloading.',
  },
  about: {
    title: 'About',
    body: 'This starter is built with Vite for fast builds and HMR, TypeScript for type safety, Tailwind CSS for styling, React Router for navigation, Zustand for state management, and Vitest + Testing Library for tests.',
  },
  notFound: {
    message: 'Page not found.',
    back: 'Go back home',
  },
  counter: {
    increment: 'Increment',
    decrement: 'Decrement',
    reset: 'Reset',
  },
  common: {
    cancel: 'Cancel',
  },
  priority: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
  tasks: {
    title: 'To-do list',
    stats: 'Completed: {{completed}} · Remaining: {{active}}',
    add: 'Add task',
    empty: {
      title: 'No tasks yet',
      hint: 'Create your first task to get started.',
    },
    nothingFound: 'Nothing found',
    item: {
      due: 'Due: {{date}}',
      overdue: 'Overdue',
      edit: 'Edit: {{title}}',
      delete: 'Delete: {{title}}',
    },
    toolbar: {
      searchPlaceholder: 'Search tasks...',
      searchLabel: 'Search tasks',
      statusLabel: 'Status',
      status: {
        all: 'All',
        active: 'Active',
        completed: 'Completed',
      },
      priorityLabel: 'Filter by priority',
      allPriorities: 'All priorities',
      sortLabel: 'Sort',
      sort: {
        newest: 'Newest first',
        oldest: 'Oldest first',
        priority: 'By priority',
        dueDate: 'By due date',
      },
    },
    form: {
      createTitle: 'New task',
      editTitle: 'Edit task',
      titleField: 'Title',
      descriptionField: 'Description',
      priorityField: 'Priority',
      dueDateField: 'Due date',
      titleRequired: 'Enter a title',
      create: 'Create',
      save: 'Save',
    },
    delete: {
      title: 'Delete task?',
      subject: '“{{title}}”',
      confirm: 'Delete',
    },
  },
  wiki: {
    title: 'Wiki',
    tagline: 'Your personal knowledge base',
    create: 'Create article',
    stats: 'Articles: {{articles}} · Tags: {{tags}}',
    navLabel: 'Wiki navigation',
    openMenu: 'Open Wiki menu',
    closeMenu: 'Close menu',
    search: {
      placeholder: 'Search articles...',
      label: 'Search articles',
      sidebarPlaceholder: 'Search',
      sidebarLabel: 'Quick search',
    },
    nothingFound: 'Nothing found',
    empty: {
      title: 'Your Wiki is empty for now',
      hint: 'Create your first article and start building your knowledge base.',
    },
    allArticles: 'All articles',
    results: 'Results',
    tags: 'Tags',
    tagFilter: 'Filter by tag',
    allTags: 'All',
    recentlyUpdated: 'Recently updated',
    recentlyCreated: 'Recently created',
    updated: 'Updated: {{date}}',
    created: 'Created: {{date}}',
    modified: 'Modified: {{date}}',
    tag: {
      heading: 'Tag #{{tag}}',
      empty: 'No articles with this tag.',
      back: 'All articles',
    },
    article: {
      edit: 'Edit',
      delete: 'Delete',
      related: 'Related articles',
      notFound: {
        title: 'Article not found',
        hint: 'It may have been deleted.',
      },
    },
    delete: {
      title: 'Delete article?',
      description: 'It will not be possible to restore it after deletion.',
      confirm: 'Delete',
    },
    editor: {
      createTitle: 'New article',
      editTitle: 'Edit article',
      titleField: 'Title',
      titleRequired: 'Enter a title',
      descriptionField: 'Short description',
      descriptionHint: 'Optional. Shown in the article list.',
      tagsField: 'Tags',
      tagsPlaceholder: 'Type a tag and press Enter',
      removeTag: 'Remove tag {{tag}}',
      contentField: 'Content',
      contentPlaceholder: '# Heading\n\nWrite in **Markdown**: lists, links, `code`, quotes…',
      write: 'Editor',
      preview: 'Preview',
      previewEmpty: 'The article preview will appear here.',
      save: 'Save',
    },
  },
}

export default en
