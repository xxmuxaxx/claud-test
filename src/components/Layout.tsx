import { Outlet } from 'react-router'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
