import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: Props) {
  const alignment = align === 'center' ? 'mx-auto text-center' : ''

  return (
    <div className={`max-w-3xl ${alignment} ${className}`}>
      {eyebrow ? (
        <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.28em] text-glow sm:text-xs">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-editorial text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.035em] text-cream sm:text-5xl lg:text-[3.8rem]">
        {title}
      </h2>
      {description ? (
        <div className="mt-5 max-w-2xl text-sm leading-7 text-cream/60 sm:text-base sm:leading-8">
          {description}
        </div>
      ) : null}
    </div>
  )
}
