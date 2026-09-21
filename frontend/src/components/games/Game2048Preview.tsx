/** Catalog illustration: a corner of the board with a pair of merging tiles. */
export function Game2048Preview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="26" height="26" rx="5" fill="currentColor" opacity="0.35" />
      <rect x="34" y="4" width="26" height="26" rx="5" fill="currentColor" opacity="0.35" />
      <rect x="4" y="34" width="26" height="26" rx="5" fill="currentColor" opacity="0.6" />
      <rect x="34" y="34" width="26" height="26" rx="5" fill="currentColor" />
      <text x="17" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="white">
        2
      </text>
      <text x="47" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="white">
        4
      </text>
    </svg>
  )
}
