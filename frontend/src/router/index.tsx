import { createBrowserRouter, type RouteObject } from 'react-router'
import { Layout } from '@/components/Layout'
import { WikiLayout } from '@/components/wiki/WikiLayout'
import { HomePage } from '@/pages/HomePage'
import { AboutPage } from '@/pages/AboutPage'
import { TasksPage } from '@/pages/TasksPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { WikiArticlePage } from '@/pages/wiki/WikiArticlePage'
import { WikiEditorPage } from '@/pages/wiki/WikiEditorPage'
import { WikiHomePage } from '@/pages/wiki/WikiHomePage'
import { WikiTagPage } from '@/pages/wiki/WikiTagPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'tasks', element: <TasksPage /> },
      {
        path: 'wiki',
        element: <WikiLayout />,
        handle: { wide: true }, // Read by Layout: the wiki needs room for a sidebar.
        children: [
          { index: true, element: <WikiHomePage /> },
          { path: 'tags/:tag', element: <WikiTagPage /> },
          { path: 'new', element: <WikiEditorPage /> },
          { path: ':articleId', element: <WikiArticlePage /> },
          { path: ':articleId/edit', element: <WikiEditorPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
