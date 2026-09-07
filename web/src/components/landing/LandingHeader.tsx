'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/BrandLogo'
import LandingAuthActions from './LandingAuthActions'

const nav = [
  { href: '#method', label: 'Method' },
  { href: '#curriculum', label: 'Curriculum' },
  { href: '#progress', label: 'Progress' },
  { href: '#system', label: 'System' },
  { href: '#about', label: 'About' },
]

export default function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080A18]/[92%] backdrop-blur-xl supports-[backdrop-filter]:bg-[#080A18]/80">
      <div className="relative mx-auto flex h-16 w-full max-w-[1240px] items-center px-5 sm:h-[72px] sm:px-8 lg:px-10">
        <Link href="/" aria-label="ECLA home" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo className="text-[1.35rem] sm:text-[1.55rem]" fireflySize={24} />
        </Link>

        <nav aria-label="Primary navigation" className="mx-auto hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-cream/50 transition-colors hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow/70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden lg:block">
          <LandingAuthActions compact />
        </div>

        <button
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] text-cream/70 transition hover:border-white/20 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow/70 lg:hidden"
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>

        {open ? (
          <div className="absolute left-5 right-5 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B111B] p-4 shadow-2xl shadow-black/40 sm:left-auto sm:right-8 sm:w-[320px] lg:hidden">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-bold text-cream/[65%] transition-colors hover:bg-white/[0.04] hover:text-cream"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <LandingAuthActions mobile />
          </div>
        ) : null}
      </div>
    </header>
  )
}
