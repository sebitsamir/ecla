import type { ButtonHTMLAttributes, ReactNode } from 'react'
type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
const variants: Record<ButtonVariant, string> = {
  primary: 'border-ember bg-ember text-obsidian hover:bg-ember-soft hover:border-ember-soft',
  secondary: 'border-line bg-surface text-ivory hover:border-line-strong hover:bg-surface-raised',
  quiet: 'border-transparent bg-transparent text-stone hover:bg-white/[0.05] hover:text-ivory',
  danger: 'border-danger/40 bg-danger/10 text-danger-soft hover:bg-danger/20',
}
const sizes: Record<ButtonSize, string> = { sm: 'min-h-10 px-3.5 text-xs', md: 'min-h-11 px-4 text-sm', lg: 'min-h-12 px-6 text-sm' }
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }
export function Button({ children, variant = 'primary', size = 'md', loading = false, disabled, className = '', ...props }: ButtonProps) {
  return <button {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={`ecla-control inline-flex items-center justify-center gap-2 rounded-control border font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>{loading ? <span className="ecla-loading-mark" aria-hidden /> : null}<span>{children}</span></button>
}
