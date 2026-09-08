import type { ButtonHTMLAttributes, ReactNode } from 'react'
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { label: string; children: ReactNode }
export function IconButton({ label, children, className = '', ...props }: IconButtonProps) {
  return <button {...props} aria-label={label} className={`ecla-control inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-stone hover:border-line-strong hover:text-ivory ${className}`}>{children}</button>
}
