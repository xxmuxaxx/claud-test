import type { Translation } from './ru'

const en: Translation = {
  nav: {
    home: 'Home',
    tasks: 'To-do list',
    about: 'About',
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
}

export default en
