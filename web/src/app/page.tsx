'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs'
import {
    BookOpen, Zap, Music, GraduationCap,
    CheckCircle2, ArrowRight, Sparkles, ArrowUpRight,
    Heart, Flame, Shield
} from 'lucide-react'
import Link from 'next/link'
import NightBackground from '@/components/NightBackground'
import Moon from '@/components/Moon'
import Firefly from '@/components/Firefly'
import { Logo, LogoMark } from '@/components/BrandLogo'

export default function LandingPage() {
    const router = useRouter()
    const { isSignedIn } = useAuth()

    useEffect(() => {
        if (isSignedIn) {
            router.push('/dashboard')
        }
    }, [isSignedIn, router])

    const modes = [
        {
            id: 'STORY',
            label: 'Story',
            tagline: 'Learn through narrative',
            desc: 'Master vocabulary and grammar naturally through engaging, bite-sized stories. Context makes it stick.',
            Icon: BookOpen,
            accent: '#FFB45A',
            bgClass: 'bg-story',
        },
        {
            id: 'DRILL',
            label: 'Drill',
            tagline: 'Rapid-fire practice',
            desc: 'Fast-paced, focused repetition to build muscle memory. Perfect for quick 5-minute sessions.',
            Icon: Zap,
            accent: '#4DD8E6',
            bgClass: 'bg-drill',
        },
        {
            id: 'IMMERSION',
            label: 'Immersion',
            tagline: 'Culture & native speech',
            desc: 'Understand the idioms, humor, and cultural context that textbooks leave out.',
            Icon: Music,
            accent: '#B98CF0',
            bgClass: 'bg-immersion',
        },
        {
            id: 'PROFESSIONAL',
            label: 'Professional',
            tagline: 'Formal & workplace',
            desc: 'Master business vocabulary, workplace etiquette, and speak with confidence in any career setting.',
            Icon: GraduationCap,
            accent: '#7FA6FF',
            bgClass: 'bg-pro',
        },
    ]

    const differentiators = [
        {
            Icon: Heart,
            title: 'Warmth, not guilt',
            desc: 'No shaming notifications. No streak resets that make you quit. Ecla rewards consistency with light, not punishment.',
        },
        {
            Icon: Flame,
            title: 'Four ways to learn',
            desc: 'Switch between Story, Drill, Immersion, and Professional modes based on your mood, goals, or the time of day.',
        },
        {
            Icon: Shield,
            title: 'Your light, your style',
            desc: 'Unlock glow colors as you grow. Your firefly evolves with you — from Classic Gold to Violet Dream.',
        },
    ]

    return (
        <main className="min-h-screen font-body text-cream selection:bg-glow/30 selection:text-night-900">
            <style>{`
                @keyframes gentle-float { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(-8px); } 
                }
                .gentle-float { animation: gentle-float 8s ease-in-out infinite; }
            `}</style>

            <NightBackground />
            <Moon phase="full" size="xl" position="top-right" />

            {/* Navigation */}
            <header className="sticky top-0 z-50 bg-night-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <LogoMark size={30} />
                        <span className="font-display text-lg font-bold text-cream tracking-tight">Ecla</span>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <SignInButton mode="modal">
                            <button className="inline-flex px-3 sm:px-4 py-2 text-sm font-semibold text-cream/70 hover:text-cream transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-glow text-night-900 text-sm font-bold hover:bg-glow-bright transition-all active:scale-[0.98]">
                                <span className="sm:inline">Get Started</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </SignUpButton>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="relative pt-24 sm:pt-32 pb-24 sm:pb-40">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Copy */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glow/30 bg-glow/5 mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-glow opacity-75 animate-ping" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-glow" />
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-glow">Now in Exclusive Beta</span>
                            </div>

                            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-black leading-[1.1] tracking-tight mb-6">
                                Master a language. <br className="hidden sm:block" />
                                <span className="text-glow">Light the way.</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-cream/70 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                                Ditch the guilt-driven streaks and robotic drills. <span className="text-cream font-semibold">Ecla adapts to how you learn</span> — with four distinct modes, a firefly companion, and zero shame.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                                <SignUpButton mode="modal">
                                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-glow text-night-900 font-bold text-base hover:bg-glow-bright transition-all active:scale-[0.98] shadow-glow-sm">
                                        Start Learning Free
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </SignUpButton>
                                <button
                                    onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/15 bg-night-800/60 text-cream font-semibold text-base hover:bg-night-800 hover:border-white/25 transition-all active:scale-[0.98] backdrop-blur-sm"
                                >
                                    See How It Works
                                </button>
                            </div>

                            <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-sm text-cream/50">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-leaf" />
                                    <span>No credit card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-leaf" />
                                    <span>Adapts to you</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-leaf" />
                                    <span>Smart Review</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Firefly visual */}
                        <div className="relative flex items-center justify-center lg:justify-end">
                            <div className="relative">
                                <div className="absolute inset-0 blur-[100px] opacity-40" style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }} />
                                <div className="relative gentle-float">
                                    <Firefly mood="proud" size={320} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* THE ANTIDOTE */}
            <section className="relative py-24 sm:py-32 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="max-w-2xl mb-16 text-center mx-auto">
                        <p className="text-sm font-bold uppercase tracking-widest text-glow mb-4">The Antidote</p>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-cream mb-5">
                            Language learning <br className="sm:hidden" />
                            <span className="text-cream/50">without the guilt.</span>
                        </h2>
                        <p className="text-cream/60 text-lg">
                            No shaming owl. No streak resets that make you quit. Just warmth, consistency, and a light that grows with you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {differentiators.map((d) => (
                            <div
                                key={d.title}
                                className="rounded-2xl border border-white/5 bg-night-800/50 backdrop-blur-sm p-8 hover:border-glow/30 hover:bg-night-800/80 transition-all duration-300"
                            >
                                <div className="h-12 w-12 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center mb-6">
                                    <d.Icon className="h-6 w-6 text-glow" />
                                </div>
                                <h3 className="font-display text-xl font-bold text-cream mb-3">{d.title}</h3>
                                <p className="text-cream/60 leading-relaxed">{d.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* THE 4 MODES */}
            <section id="modes" className="relative py-24 sm:py-32">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="max-w-2xl mb-16">
                        <p className="text-sm font-bold uppercase tracking-widest text-glow mb-4">Your Journey</p>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-cream mb-5">
                            One curriculum. <br className="sm:hidden" />
                            <span className="text-cream/50">Four ways to learn.</span>
                        </h2>
                        <p className="text-cream/60 text-lg">
                            Switch modes instantly based on your mood, goals, or the time of day. The whole experience reshapes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {modes.map((mode) => (
                            <div
                                key={mode.id}
                                className="group rounded-2xl border border-white/5 bg-night-800/50 backdrop-blur-sm p-6 hover:border-opacity-50 transition-all duration-300"
                                style={{ ['--mode-accent' as any]: mode.accent }}
                            >
                                <div className="relative">
                                    <div
                                        className={`h-12 w-12 rounded-xl ${mode.bgClass}/15 border border-current/20 flex items-center justify-center mb-6`}
                                        style={{ color: mode.accent }}
                                    >
                                        <mode.Icon className="h-6 w-6" />
                                    </div>

                                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: mode.accent }}>
                                        {mode.label} Mode
                                    </p>
                                    <h3 className="font-display text-lg font-bold text-cream mb-3">{mode.tagline}</h3>
                                    <p className="text-cream/60 leading-relaxed text-sm mb-6">{mode.desc}</p>

                                    <div
                                        className="flex items-center gap-1 text-sm font-semibold"
                                        style={{ color: mode.accent }}
                                    >
                                        Explore <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MEET ECLA */}
            <section className="relative py-24 sm:py-32 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Firefly visual */}
                        <div className="relative flex items-center justify-center order-2 lg:order-1">
                            <div className="relative">
                                <div className="absolute inset-0 blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }} />
                                <div className="relative">
                                    <Firefly mood="idle" size={280} />
                                </div>
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="order-1 lg:order-2 text-center lg:text-left">
                            <p className="text-sm font-bold uppercase tracking-widest text-glow mb-4">Meet Ecla</p>
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-cream mb-6">
                                Your firefly <br className="hidden sm:block" />
                                <span className="text-glow">grows with you.</span>
                            </h2>
                            <p className="text-cream/60 text-lg leading-relaxed mb-8">
                                Ecla isn't just a mascot — she's your companion. She celebrates your wins, dims when you struggle, and evolves her glow as your consistency compounds.
                            </p>
                            <ul className="space-y-4 text-left max-w-md mx-auto lg:mx-0">
                                {[
                                    'Perches on your current lesson',
                                    'Reacts to every answer in real-time',
                                    'Unlocks new glow colors as you progress',
                                    'Celebrates your journey, not just streaks',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-cream/70">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-glow/20 border border-glow/30 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="h-3 w-3 text-glow" />
                                        </div>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="relative py-24 sm:py-32 border-t border-white/5">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="relative inline-block mb-10">
                        <div className="absolute inset-0 blur-[80px] opacity-30" style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }} />
                        <Firefly mood="proud" size={140} />
                    </div>
                    <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-cream mb-6 leading-tight">
                        Ready to find <br className="sm:hidden" />
                        <span className="text-glow">your fluency?</span>
                    </h2>
                    <p className="text-cream/60 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
                        Join the exclusive Ecla beta. Shape the future of language learning and keep your glow forever.
                    </p>
                    <SignUpButton mode="modal">
                        <button className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-glow text-night-900 font-bold text-lg hover:bg-glow-bright transition-all active:scale-[0.98] shadow-glow-sm">
                            Create Free Account
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </SignUpButton>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Logo className="text-4xl" fireflySize={44} />
                    <p className="text-sm text-cream/40 text-center sm:text-right">
                        © {new Date().getFullYear()} Ecla Language Learning. Warmth, not guilt.
                    </p>
                </div>
            </footer>
        </main>
    )
}