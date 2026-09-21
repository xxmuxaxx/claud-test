import { NavLink } from 'react-router'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
]

export function Navbar() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <span className="text-lg font-semibold">Modern React App</span>
        <ul className="flex gap-6 text-sm font-medium">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
