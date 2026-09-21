import type { Translation } from './ru'

const ka: Translation = {
  nav: {
    home: 'მთავარი',
    tasks: 'დავალებების სია',
    about: 'შესახებ',
  },
  language: {
    label: 'ენა',
  },
  home: {
    title: 'კეთილი იყოს თქვენი მობრძანება',
    intro:
      'სასტარტო პროექტი: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + Zustand. შეცვალეთ <code>src/pages/HomePage.tsx</code> და შეინახეთ, რომ იხილოთ ცხელი გადატვირთვა.',
  },
  about: {
    title: 'შესახებ',
    body: 'ეს სასტარტო პროექტი აგებულია Vite-ით სწრაფი აწყობისა და HMR-ისთვის, TypeScript-ით ტიპური უსაფრთხოებისთვის, Tailwind CSS-ით სტილიზაციისთვის, React Router-ით ნავიგაციისთვის, Zustand-ით მდგომარეობის მართვისთვის და Vitest + Testing Library-ით ტესტირებისთვის.',
  },
  notFound: {
    message: 'გვერდი ვერ მოიძებნა.',
    back: 'მთავარ გვერდზე დაბრუნება',
  },
  counter: {
    increment: 'გაზრდა',
    decrement: 'შემცირება',
    reset: 'განულება',
  },
  common: {
    cancel: 'გაუქმება',
  },
  priority: {
    low: 'დაბალი',
    medium: 'საშუალო',
    high: 'მაღალი',
  },
  tasks: {
    title: 'დავალებების სია',
    stats: 'შესრულებულია: {{completed}} · დარჩენილია: {{active}}',
    add: 'დავალების დამატება',
    empty: {
      title: 'დავალებები ჯერ არ არის',
      hint: 'დასაწყებად შექმენით პირველი დავალება.',
    },
    nothingFound: 'ვერაფერი მოიძებნა',
    item: {
      due: 'ვადა: {{date}}',
      overdue: 'ვადაგადაცილებული',
      edit: 'რედაქტირება: {{title}}',
      delete: 'წაშლა: {{title}}',
    },
    toolbar: {
      searchPlaceholder: 'დავალებების ძიება...',
      searchLabel: 'დავალებების ძიება',
      statusLabel: 'სტატუსი',
      status: {
        all: 'ყველა',
        active: 'აქტიური',
        completed: 'შესრულებული',
      },
      priorityLabel: 'ფილტრი პრიორიტეტით',
      allPriorities: 'ყველა პრიორიტეტი',
      sortLabel: 'დახარისხება',
      sort: {
        newest: 'ჯერ ახლები',
        oldest: 'ჯერ ძველები',
        priority: 'პრიორიტეტის მიხედვით',
        dueDate: 'შესრულების ვადის მიხედვით',
      },
    },
    form: {
      createTitle: 'ახალი დავალება',
      editTitle: 'დავალების რედაქტირება',
      titleField: 'სათაური',
      descriptionField: 'აღწერა',
      priorityField: 'პრიორიტეტი',
      dueDateField: 'შესრულების თარიღი',
      titleRequired: 'შეიყვანეთ სათაური',
      create: 'შექმნა',
      save: 'შენახვა',
    },
    delete: {
      title: 'წავშალოთ დავალება?',
      subject: '„{{title}}“',
      confirm: 'წაშლა',
    },
  },
}

export default ka
