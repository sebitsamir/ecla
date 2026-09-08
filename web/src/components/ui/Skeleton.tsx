import type { HTMLAttributes } from 'react'
export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div {...props} aria-hidden className={`ecla-skeleton rounded-surface ${className}`} /> }
