import type { Translation } from './ru'

const ka: Translation = {
  nav: {
    home: 'მთავარი',
    tasks: 'დავალებების სია',
    about: 'შესახებ',
    wiki: 'ვიკი',
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
  wiki: {
    title: 'ვიკი',
    tagline: 'თქვენი პირადი ცოდნის ბაზა',
    create: 'სტატიის შექმნა',
    stats: 'სტატიები: {{articles}} · ტეგები: {{tags}}',
    navLabel: 'ვიკის ნავიგაცია',
    openMenu: 'ვიკის მენიუს გახსნა',
    closeMenu: 'მენიუს დახურვა',
    search: {
      placeholder: 'სტატიებში ძიება...',
      label: 'სტატიებში ძიება',
      sidebarPlaceholder: 'ძიება',
      sidebarLabel: 'სწრაფი ძიება',
    },
    nothingFound: 'არაფერი მოიძებნა',
    empty: {
      title: 'თქვენი ვიკი ჯერ ცარიელია',
      hint: 'შექმენით პირველი სტატია და დაიწყეთ ცოდნის ბაზის შეგროვება.',
    },
    allArticles: 'ყველა სტატია',
    results: 'შედეგები',
    tags: 'ტეგები',
    tagFilter: 'ტეგით ფილტრი',
    allTags: 'ყველა',
    recentlyUpdated: 'ახლახან შეცვლილი',
    recentlyCreated: 'ახლახან შექმნილი',
    updated: 'განახლდა: {{date}}',
    created: 'შეიქმნა: {{date}}',
    modified: 'შეიცვალა: {{date}}',
    tag: {
      heading: 'ტეგი #{{tag}}',
      empty: 'ამ ტეგით სტატიები არ არის.',
      back: 'ყველა სტატია',
    },
    article: {
      edit: 'რედაქტირება',
      delete: 'წაშლა',
      related: 'დაკავშირებული სტატიები',
      notFound: {
        title: 'სტატია ვერ მოიძებნა',
        hint: 'შესაძლოა, ის წაშლილია.',
      },
    },
    delete: {
      title: 'წავშალოთ სტატია?',
      description: 'წაშლის შემდეგ მისი აღდგენა შეუძლებელი იქნება.',
      confirm: 'წაშლა',
    },
    editor: {
      createTitle: 'ახალი სტატია',
      editTitle: 'სტატიის რედაქტირება',
      titleField: 'სათაური',
      titleRequired: 'შეიყვანეთ სათაური',
      descriptionField: 'მოკლე აღწერა',
      descriptionHint: 'არასავალდებულო. ჩანს სტატიების სიაში.',
      tagsField: 'ტეგები',
      tagsPlaceholder: 'შეიყვანეთ ტეგი და დააჭირეთ Enter-ს',
      removeTag: 'ტეგის ამოშლა {{tag}}',
      contentField: 'შინაარსი',
      contentPlaceholder: '# სათაური\n\nწერეთ **Markdown**-ში: სიები, ბმულები, `კოდი`, ციტატები…',
      write: 'რედაქტორი',
      preview: 'გადახედვა',
      previewEmpty: 'აქ გამოჩნდება სტატიის გადახედვა.',
      save: 'შენახვა',
    },
  },
}

export default ka
