import { Outlet, useMatches } from 'react-router'
import { cn } from '@/lib/cn'
import { Navbar } from './Navbar'

export function Layout() {
  // Routes opt into the wide container via `handle: { wide: true }`.
  const wide = useMatches().some((match) => (match.handle as { wide?: boolean } | undefined)?.wide)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar wide={wide} />
      <main className={cn('mx-auto px-4 py-10', wide ? 'max-w-7xl' : 'max-w-3xl')}>
        <Outlet />
      </main>
    </div>
  )
}
