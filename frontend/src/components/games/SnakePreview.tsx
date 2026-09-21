/** Catalog illustration: a snake heading for an apple. */
export function SnakePreview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M8 48h32a8 8 0 0 0 0-16H24a8 8 0 0 1 0-16h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="16" r="3" fill="var(--color-slate-900)" />
      <circle cx="56" cy="48" r="5" className="fill-red-500" />
    </svg>
  )
}
