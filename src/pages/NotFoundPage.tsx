import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="text-slate-600 dark:text-slate-400">Page not found.</p>
      <Link to="/" className="text-brand-600 hover:underline dark:text-brand-400">
        Go back home
      </Link>
    </div>
  )
}
