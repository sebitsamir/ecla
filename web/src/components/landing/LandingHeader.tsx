'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/BrandLogo'
import LandingAuthActions from './LandingAuthActions'

const nav = [
  { href: '#method', label: 'How it works' },
  { href: '#learning', label: 'Learning' },
  { href: '#progress', label: 'Progress' },
]

export default function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-obsidian/[92%] backdrop-blur-xl supports-[backdrop-filter]:bg-obsidian/80">
      <div className="relative mx-auto flex h-14 w-full max-w-[1200px] items-center px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ECLA home" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo className="ecla-logo-for-dark h-7 w-auto sm:h-8" height={30} tone="dark" />
          <Logo className="ecla-logo-for-light h-7 w-auto sm:h-8" height={30} tone="light" />
        </Link>

        <nav aria-label="Primary navigation" className="mx-auto hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/70"
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
          className="ml-auto grid size-11 place-items-center rounded-control border border-line text-stone transition hover:border-line-strong hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/70 lg:hidden"
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>

        {open ? (
          <div className="absolute left-5 right-5 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-white/[0.08] bg-carbon p-4 shadow-2xl shadow-black/40 sm:left-auto sm:right-8 sm:w-[320px] lg:hidden">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-bold text-ivory/[65%] transition-colors hover:bg-white/[0.04] hover:text-ivory"
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
