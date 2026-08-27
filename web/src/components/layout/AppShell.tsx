'use client'

/**
 * AppShell — permanent chrome (Phase 11.1, revised).
 *
 * Fixes applied:
 * - Responsive: hamburger + slide-in drawer below md; fixed sidebar md+.
 * - Amber/gold primary (brand), semantic colors untouched.
 * - Functional user area: Clerk avatar + name + menu (email, sign out).
 * - Fuller nav: Home / My Learning / Gateway / Progress (all real routes).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import { Flag, Home, LogOut, Map, Menu, MessageCircle, Repeat, TrendingUp, X } from 'lucide-react'
import type { ReactNode } from 'react'

const NAV = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/course', label: 'My Learning', icon: Map },
    { href: '/review', label: 'Review', icon: Repeat },
    { href: '/chat', label: 'Chat with Ecla', icon: MessageCircle },
    { href: '/gateway', label: 'Gateway', icon: Flag },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
]

function Brand() {
    return (
        <Link href="/dashboard" className="px-2">
            <span className="font-display text-xl font-bold tracking-tight text-cream">ECLA</span>
            <span className="block text-[10px] uppercase tracking-widest text-cream/40">Speak · Understand · Use</span>
        </Link>
    )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname()
    return (
        <nav className="flex flex-col gap-1">
            {NAV.map(item => {
                const active = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-glow text-night-900' : 'text-cream/60 hover:bg-white/5 hover:text-cream'
                            }`}
                    >
                        <item.icon className="h-4 w-4" /> {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}

function SidebarFoot() {
    return (
        <div className="mt-auto w-full min-w-0 rounded-2xl border border-white/10 bg-[#13131B] p-4">
            <p className="mb-1 truncate text-xs font-bold text-cream/80">Learn for real life</p>
            <p className="text-[11px] leading-relaxed text-cream/50">Not just words. Language for what matters.</p>
        </div>
    )
}

export default function AppShell({ children }: { children: ReactNode }) {
    const { user } = useUser()
    const { signOut } = useClerk()
    const [navOpen, setNavOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const pathname = usePathname()

    // Close overlays on navigation.
    useEffect(() => { setNavOpen(false); setMenuOpen(false) }, [pathname])

    const name = user?.firstName ?? user?.username ?? 'Learner'
    const image = user?.imageUrl

    return (
        <main className="min-h-screen bg-[#0B0B10] font-body text-white">
            {/* ── Top bar (all sizes) ─ */}
            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B10]/90 backdrop-blur">
                <div className="flex h-14 items-center gap-3 px-4 md:px-6">
                    <button
                        onClick={() => setNavOpen(true)}
                        aria-label="Open navigation"
                        className="rounded-lg p-2 text-cream/60 hover:bg-white/5 hover:text-cream md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-display text-lg font-bold md:hidden">ECLA</span>
                    <span className="hidden md:block"><Brand /></span>

                    <div className="ml-auto relative">
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className="flex items-center gap-2 rounded-full border border-white/10 bg-[#13131B] py-1 pl-1 pr-3 hover:border-glow/40 transition-colors"
                            aria-label="Account menu"
                        >
                            {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={image} alt={name} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-glow/20 text-xs font-bold text-glow">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="hidden text-sm text-cream/80 sm:block">{name}</span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-[#13131B] p-2 shadow-2xl">
                                <div className="border-b border-white/5 px-3 py-2">
                                    <p className="text-sm font-semibold text-cream">{name}</p>
                                    <p className="truncate text-xs text-cream/50">
                                        {user?.primaryEmailAddress?.emailAddress ?? ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-cream/80 hover:bg-white/5"
                                >
                                    <LogOut className="h-4 w-4" /> Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-[1400px]">
                {/* ── Desktop sidebar ─ */}
                {/* Desktop sidebar: add min-w-0 */}
                <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 min-w-0 flex-shrink-0 flex-col gap-4 border-r border-white/5 px-4 py-6 md:flex">
                    <NavLinks />
                    <SidebarFoot />
                </aside>

                {/* ── Mobile drawer ─ */}
                {navOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={() => setNavOpen(false)}>
                        <div className="flex h-full w-72 flex-col gap-6 bg-[#0B0B10] p-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <Brand />
                                <button onClick={() => setNavOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 text-cream/60 hover:text-cream">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <NavLinks onNavigate={() => setNavOpen(false)} />
                            <SidebarFoot />
                        </div>
                    </div>
                )}

                {/* ── Content  */}
                <div className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</div>
            </div>
        </main>
    )
}