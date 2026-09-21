import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'
import { buttonClass, type ButtonVariant } from './buttonClass'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** A request started by this button is in flight: shows a spinner and blocks repeat clicks. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
