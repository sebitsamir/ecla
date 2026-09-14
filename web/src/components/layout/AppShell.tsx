'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { BookOpen, Home, MessageCircle, Repeat2, Route, TrendingUp } from 'lucide-react'
import { Logo } from '@/components/BrandLogo'

const DESKTOP_NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/course', label: 'Learn', icon: Route },
  { href: '/review', label: 'Practice', icon: Repeat2 },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/gateway', label: 'Gateway', icon: BookOpen },
] as const

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/course', label: 'Learn', icon: Route },
  { href: '/review', label: 'Practice', icon: Repeat2 },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
] as const

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href === '/course' && pathname.startsWith('/learn/'))
}

function Brand() {
  return (
    <Link href="/dashboard" className="ecla-control inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-ivory" aria-label="Ecla home">
      <Logo height={32} className="ecla-logo-for-dark h-8 w-auto" tone="dark" />
      <Logo height={32} className="ecla-logo-for-light h-8 w-auto" tone="light" />
    </Link>
  )
}

function PrimaryNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  const items = mobile ? MOBILE_NAV : DESKTOP_NAV
  return (
    <nav aria-label="Primary navigation" className={mobile ? 'grid grid-cols-5' : 'flex items-stretch gap-0.5'}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = isCurrent(pathname, href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={mobile
              ? `ecla-control relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-control text-[10px] font-medium ${active ? 'text-ember-soft' : 'text-ash'}`
              : `ecla-control relative flex min-h-14 items-center px-2.5 text-xs font-medium ${active ? 'text-ivory' : 'text-stone hover:text-ivory'}`}>
            <Icon className={mobile ? 'size-5' : 'hidden'} aria-hidden />
            <span>{label}</span>
            {mobile && active ? <span className="absolute inset-x-5 top-0 h-px bg-ember" /> : null}
            {!mobile && active ? <span className="absolute inset-x-2.5 bottom-0 h-px bg-ember shadow-[0_0_12px_rgba(230,162,60,.7)]" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const name = user?.firstName ?? user?.username ?? 'Learner'
  const image = user?.imageUrl

  return (
    <main className="min-h-screen bg-transparent font-body text-ivory">
      <a href="#main-content" className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-control bg-ember px-4 py-2 text-sm font-semibold text-obsidian transition-transform focus:translate-y-0">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-obsidian/82 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Brand />
          <div className="hidden lg:block"><PrimaryNavigation /></div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/gateway" aria-label="Open Gateway assessment" className="ecla-control flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-stone hover:border-line-strong hover:text-ivory lg:hidden">
              <BookOpen className="size-4" /><span className="hidden sm:inline">Gateway</span>
            </Link>
            <Link href="/profile" aria-label={`Open profile and settings for ${name}`}
              className="ecla-control flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-stone hover:border-line-strong hover:text-ivory">
              {image ? <Image src={image} alt="" width={32} height={32} className="size-8 rounded-full object-cover" /> : <span className="flex size-8 items-center justify-center rounded-full bg-ember/15 text-xs font-semibold text-ember-soft">{name.charAt(0).toUpperCase()}</span>}
              <span className="hidden text-xs font-medium sm:block">Profile</span>
            </Link>
          </div>
        </div>
      </header>
      <div id="main-content" className="ecla-page-enter mx-auto min-w-0 max-w-[1200px] overflow-x-clip px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:px-8 xl:pb-9">{children}</div>
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-obsidian/96 px-1 backdrop-blur-xl xl:hidden"><div className="mx-auto max-w-2xl"><PrimaryNavigation mobile /></div></div>
    </main>
  )
}
