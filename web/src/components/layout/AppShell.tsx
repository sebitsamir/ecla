'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import { BookOpen, Home, LogOut, MessageCircle, Repeat2, Route, TrendingUp, X } from 'lucide-react'
import { LogoMark } from '@/components/BrandLogo'
import { IconButton } from '@/components/ui'

const PRIMARY_NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/course', label: 'Learn', icon: Route },
  { href: '/review', label: 'Practice', icon: Repeat2 },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
] as const

const SECONDARY_NAV = [
  { href: '/chat', label: 'Chat with Ecla', icon: MessageCircle },
  { href: '/gateway', label: 'Gateway assessment', icon: BookOpen },
] as const

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href === '/course' && pathname.startsWith('/learn/'))
}

function Brand() {
  return (
    <Link href="/dashboard" className="ecla-control inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-ivory" aria-label="Ecla home">
      <LogoMark size={30} />
      <span className="font-display text-2xl leading-none">Ecla</span>
    </Link>
  )
}

function PrimaryNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Primary navigation" className={mobile ? 'grid grid-cols-4' : 'flex items-stretch gap-1'}>
      {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
        const active = isCurrent(pathname, href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={mobile
              ? `ecla-control flex min-h-14 flex-col items-center justify-center gap-1 rounded-control text-[10px] font-medium ${active ? 'text-ember-soft' : 'text-ash'}`
              : `ecla-control relative flex min-h-14 items-center px-3 text-xs font-medium ${active ? 'text-ivory' : 'text-stone hover:text-ivory'}`}>
            <Icon className={mobile ? 'size-5' : 'hidden'} aria-hidden />
            <span>{label}</span>
            {!mobile && active ? <span className="absolute inset-x-3 bottom-0 h-px bg-ember shadow-[0_0_12px_rgba(255,122,61,.7)]" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const name = user?.firstName ?? user?.username ?? 'Learner'
  const image = user?.imageUrl

  useEffect(() => {
    if (!accountOpen) return
    const close = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [accountOpen])

  return (
    <main className="min-h-screen bg-transparent font-body text-ivory">
      <a href="#main-content" className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-control bg-ember px-4 py-2 text-sm font-semibold text-obsidian transition-transform focus:translate-y-0">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-obsidian/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-10">
          <Brand />
          <div className="hidden lg:block"><PrimaryNavigation /></div>
          <div ref={accountRef} className="relative ml-auto">
            <button onClick={() => setAccountOpen(value => !value)} aria-expanded={accountOpen} aria-haspopup="menu"
              className="ecla-control flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-stone hover:border-line-strong hover:text-ivory">
              {image ? <Image src={image} alt="" width={32} height={32} className="size-8 rounded-full object-cover" /> : <span className="flex size-8 items-center justify-center rounded-full bg-ember/15 text-xs font-semibold text-ember-soft">{name.charAt(0).toUpperCase()}</span>}
              <span className="hidden max-w-32 truncate text-xs sm:block">{name}</span>
            </button>
            {accountOpen ? (
              <div role="menu" className="ecla-surface absolute right-0 mt-2 w-64 rounded-surface p-2 animate-fade-in">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-ivory">{name}</p><p className="truncate text-xs text-ash">{user?.primaryEmailAddress?.emailAddress ?? ''}</p></div>
                  <IconButton label="Close account menu" onClick={() => setAccountOpen(false)} className="size-9 border-transparent bg-transparent"><X className="size-4" /></IconButton>
                </div>
                <div className="my-1 h-px bg-line" />
                {SECONDARY_NAV.map(({ href, label, icon: Icon }) => <Link role="menuitem" key={href} href={href} onClick={() => setAccountOpen(false)} className="ecla-control flex min-h-11 items-center gap-3 rounded-control px-3 text-sm text-stone hover:bg-white/[0.05] hover:text-ivory"><Icon className="size-4" />{label}</Link>)}
                <button role="menuitem" onClick={() => signOut()} className="ecla-control flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-stone hover:bg-white/[0.05] hover:text-ivory"><LogOut className="size-4" />Sign out</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <div id="main-content" className="mx-auto min-w-0 max-w-[1320px] px-4 py-6 pb-24 sm:px-6 md:py-8 lg:px-8 lg:pb-10 xl:px-10">{children}</div>
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-obsidian/94 px-1 pt-1 backdrop-blur-xl lg:hidden"><PrimaryNavigation mobile /></div>
    </main>
  )
}
