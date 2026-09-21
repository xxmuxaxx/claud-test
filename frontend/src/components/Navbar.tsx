import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'

const links = [
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/wiki', labelKey: 'nav.wiki' },
  { to: '/games', labelKey: 'nav.games' },
  { to: '/neural-network', labelKey: 'nav.neuralNetwork' },
] as const

export function Navbar({ wide = false }: { wide?: boolean }) {
  const { t } = useTranslation()

  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <nav
        className={cn(
          'mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4',
          wide ? 'max-w-7xl' : 'max-w-3xl',
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold">
          <img src="/favicon.svg" alt="" width={28} height={28} className="size-7" />
          Nook
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ul className="flex gap-6 text-sm font-medium whitespace-nowrap">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }
                >
                  {t(link.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    </header>
  )
}
