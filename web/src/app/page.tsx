'use client'

/**
 * Landing Page: Marketing & Conversion
 * 
 * This is the public-facing landing page for unauthenticated users.
 * It serves as the primary conversion funnel with:
 * - Hero section with value proposition
 * - Four learning modes showcase
 * - Product differentiators
 * - Ecla companion introduction
 * - Final conversion CTA
 * 
 * Key Features:
 * - Responsive design from mobile (320px) to desktop (1920px+)
 * - Smooth scroll navigation
 * - Animated Firefly companion
 * - Clerk-powered auth modals (Sign In / Sign Up)
 * - Auto-redirect for authenticated users
 * 
 * Architecture:
 * - Static content, no API calls needed
 * - Client-side only for auth state checking
 * - Clerk SignInButton/SignUpButton handle auth modals
 * - Auto-redirects to dashboard if already signed in
 * 
 * Why No Loading State:
 * This page is purely static content with no data fetching.
 * It renders immediately without any async operations.
 * Loading states are only needed for pages that fetch data from APIs.
 * 
 * Conversion Strategy:
 * - Hero: Immediate value prop + dual CTAs
 * - Differentiators: Emotional benefits (warmth, not guilt)
 * - Modes: Feature showcase (4 ways to learn)
 * - Ecla: Companion relationship building
 * - Final CTA: Urgency + exclusivity
 * 
 * Tech Stack:
 * - Clerk: Authentication (SignInButton, SignUpButton)
 * - Lucide: Professional iconography
 * - Tailwind: Responsive design system
 * - Custom components: Firefly, Moon, NightBackground, Logo
 */

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
import { DEFAULT_GLOW } from '@/lib/cosmetics'

/**
 * Learning mode showcase data
 * Each mode has unique visual identity and value proposition
 */
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

/**
 * Product differentiators
 * Emotional benefits that set Ecla apart from competitors
 */
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

/**
 * Landing Page Component
 * 
 * Main component rendering the entire marketing experience.
 * 
 * Key Behaviors:
 * - Checks auth state on mount
 * - Auto-redirects signed-in users to dashboard
 * - Smooth scroll for in-page navigation
 * - Responsive across all device sizes
 * 
 * The page renders immediately without any loading state
 * since all content is static and requires no API calls.
 */
export default function LandingPage() {
    const router = useRouter()
    const { isSignedIn } = useAuth()

    /**
     * Auto-redirect authenticated users to dashboard
     * Prevents signed-in users from seeing the landing page
     */
    useEffect(() => {
        if (isSignedIn) {
            router.push('/dashboard')
        }
    }, [isSignedIn, router])

    /**
     * Smooth scroll to section
     * Used by "See How It Works" button in hero
     * 
     * @param id - Target section ID
     */
    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        })
    }

    return (
        <main className="min-h-screen font-body text-cream selection:bg-glow/30 selection:text-night-900">
            <style>{`
                @keyframes gentle-float { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(-8px); } 
                }
                .gentle-float { animation: gentle-float 8s ease-in-out infinite; }
                
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .fade-in-up { animation: fade-in-up 0.6s ease-out; }
                
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.6; }
                }
                .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
            `}</style>

            <NightBackground />
            <Moon phase="full" size="xl" position="top-right" />

            {/* ── Navigation Header ─ */}
            <header className="sticky top-0 z-50 bg-night-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
                        <LogoMark size={26} className="transition-transform group-hover:scale-110" />
                        <span className="font-display text-base sm:text-lg font-bold text-cream tracking-tight">Ecla</span>
                    </Link>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <SignInButton mode="modal">
                            <button className="inline-flex px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-cream/70 hover:text-cream transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-glow text-night-900 text-xs sm:text-sm font-bold hover:bg-glow-bright transition-all active:scale-[0.98] shadow-glow-sm">
                                <span>Get Started</span>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </SignUpButton>
                    </div>
                </div>
            </header>

            {/* ── Hero Section ─ */}
            <section className="relative pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-24 lg:pb-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left: Copy */}
                        <div className="text-center lg:text-left fade-in-up">
                            {/* Beta badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glow/30 bg-glow/5 mb-6 sm:mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-glow opacity-75 animate-ping" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-glow" />
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-glow">Now in Exclusive Beta</span>
                            </div>

                            {/* Headline */}
                            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-4 sm:mb-6">
                                Master a language. <br className="hidden sm:block" />
                                <span className="text-glow">Light the way.</span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-base sm:text-lg lg:text-xl text-cream/70 max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed">
                                Ditch the guilt-driven streaks and robotic drills. <span className="text-cream font-semibold">Ecla adapts to how you learn</span> — with four distinct modes, a firefly companion, and zero shame.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mb-8 sm:mb-12">
                                <SignUpButton mode="modal">
                                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-glow text-night-900 font-bold text-sm sm:text-base hover:bg-glow-bright transition-all active:scale-[0.98] shadow-glow-sm">
                                        Start Learning Free
                                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </SignUpButton>
                                <button
                                    onClick={() => scrollToSection('modes')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/15 bg-night-800/60 text-cream font-semibold text-sm sm:text-base hover:bg-night-800 hover:border-white/25 transition-all active:scale-[0.98] backdrop-blur-sm"
                                >
                                    See How It Works
                                </button>
                            </div>

                            {/* Trust indicators */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 sm:gap-x-8 gap-y-2.5 text-xs sm:text-sm text-cream/50">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-leaf" />
                                    <span>No credit card</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-leaf" />
                                    <span>Adapts to you</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-leaf" />
                                    <span>Smart Review</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Firefly visual */}
                        <div className="relative flex items-center justify-center lg:justify-end order-first lg:order-last mb-8 lg:mb-0">
                            <div className="relative">
                                {/* Ambient glow */}
                                <div className="absolute inset-0 blur-[80px] sm:blur-[100px] opacity-40 pulse-glow" style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }} />
                                {/* Firefly with gentle float animation */}
                                <div className="relative gentle-float">
                                    <Firefly mood="proud" size={240} glow={DEFAULT_GLOW} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Differentiators Section ─ */}
            <section className="relative py-16 sm:py-24 lg:py-32 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    {/* Section header */}
                    <div className="max-w-2xl mb-12 sm:mb-16 text-center mx-auto">
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-glow mb-3 sm:mb-4">The Antidote</p>
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-cream mb-4 sm:mb-5">
                            Language learning <br className="sm:hidden" />
                            <span className="text-cream/50">without the guilt.</span>
                        </h2>
                        <p className="text-cream/60 text-base sm:text-lg">
                            No shaming owl. No streak resets that make you quit. Just warmth, consistency, and a light that grows with you.
                        </p>
                    </div>

                    {/* Differentiator cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        {differentiators.map((d, index) => (
                            <div
                                key={d.title}
                                className="group rounded-2xl border border-white/5 bg-night-800/50 backdrop-blur-sm p-6 sm:p-8 hover:border-glow/30 hover:bg-night-800/80 transition-all duration-300 hover:shadow-glow-sm"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon container */}
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <d.Icon className="h-5 w-5 sm:h-6 sm:w-6 text-glow" />
                                </div>
                                
                                {/* Content */}
                                <h3 className="font-display text-lg sm:text-xl font-bold text-cream mb-2 sm:mb-3">{d.title}</h3>
                                <p className="text-cream/60 leading-relaxed text-sm sm:text-base">{d.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Four Modes Section ─ */}
            <section id="modes" className="relative py-16 sm:py-24 lg:py-32">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    {/* Section header */}
                    <div className="max-w-2xl mb-12 sm:mb-16">
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-glow mb-3 sm:mb-4">Your Journey</p>
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-cream mb-4 sm:mb-5">
                            One curriculum. <br className="sm:hidden" />
                            <span className="text-cream/50">Four ways to learn.</span>
                        </h2>
                        <p className="text-cream/60 text-base sm:text-lg">
                            Switch modes instantly based on your mood, goals, or the time of day. The whole experience reshapes.
                        </p>
                    </div>

                    {/* Mode cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                        {modes.map((mode, index) => (
                            <div
                                key={mode.id}
                                className="group rounded-2xl border border-white/5 bg-night-800/50 backdrop-blur-sm p-5 sm:p-6 hover:border-opacity-50 transition-all duration-300 hover:shadow-glow-sm cursor-pointer"
                                style={{ 
                                    ['--mode-accent' as any]: mode.accent,
                                    animationDelay: `${index * 100}ms`
                                }}
                                onClick={() => {}}
                            >
                                <div className="relative">
                                    {/* Icon container */}
                                    <div
                                        className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${mode.bgClass}/15 border border-current/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}
                                        style={{ color: mode.accent }}
                                    >
                                        <mode.Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>

                                    {/* Mode label */}
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: mode.accent }}>
                                        {mode.label} Mode
                                    </p>
                                    
                                    {/* Tagline */}
                                    <h3 className="font-display text-base sm:text-lg font-bold text-cream mb-2 sm:mb-3">{mode.tagline}</h3>
                                    
                                    {/* Description */}
                                    <p className="text-cream/60 leading-relaxed text-xs sm:text-sm mb-4 sm:mb-6">{mode.desc}</p>

                                    {/* Explore link */}
                                    <div
                                        className="flex items-center gap-1 text-xs sm:text-sm font-semibold group-hover:gap-2 transition-all duration-300"
                                        style={{ color: mode.accent }}
                                    >
                                        Explore <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Meet Ecla Section ─ */}
            <section className="relative py-16 sm:py-24 lg:py-32 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Firefly visual */}
                        <div className="relative flex items-center justify-center order-2 lg:order-1">
                            <div className="relative">
                                {/* Ambient glow */}
                                <div className="absolute inset-0 blur-[100px] sm:blur-[120px] opacity-30 pulse-glow" style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }} />
                                {/* Firefly */}
                                <div className="relative">
                                    <Firefly mood="idle" size={200} glow={DEFAULT_GLOW} />
                                </div>
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="order-1 lg:order-2 text-center lg:text-left">
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-glow mb-3 sm:mb-4">Meet Ecla</p>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-cream mb-4 sm:mb-6">
                                Your firefly <br className="hidden sm:block" />
                                <span className="text-glow">grows with you.</span>
                            </h2>
                            <p className="text-cream/60 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                                Ecla isn't just a mascot — she's your companion. She celebrates your wins, dims when you struggle, and evolves her glow as your consistency compounds.
                            </p>
                            
                            {/* Feature list */}
                            <ul className="space-y-3 sm:space-y-4 text-left max-w-md mx-auto lg:mx-0">
                                {[
                                    'Perches on your current lesson',
                                    'Reacts to every answer in real-time',
                                    'Unlocks new glow colors as you progress',
                                    'Celebrates your journey, not just streaks',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 sm:gap-3 text-cream/70 text-sm sm:text-base">
                                        <div className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-glow/20 border border-glow/30 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-glow" />
                                        </div>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA Section ─ */}
            <section className="relative py-16 sm:py-24 lg:py-32 border-t border-white/5">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    {/* Firefly visual */}
                    <div className="relative inline-block mb-8 sm:mb-10">
                        <div className="absolute inset-0 blur-[60px] sm:blur-[80px] opacity-30 pulse-glow" style={{ background: 'radial-gradient(circle, #FFC857 0%, transparent 70%)' }} />
                        <Firefly mood="proud" size={100} glow={DEFAULT_GLOW} />
                    </div>
                    
                    {/* Headline */}
                    <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-cream mb-4 sm:mb-6 leading-tight">
                        Ready to find <br className="sm:hidden" />
                        <span className="text-glow">your fluency?</span>
                    </h2>
                    
                    {/* Subheadline */}
                    <p className="text-cream/60 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
                        Join the exclusive Ecla beta. Shape the future of language learning and keep your glow forever.
                    </p>
                    
                    {/* CTA button */}
                    <SignUpButton mode="modal">
                        <button className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-glow text-night-900 font-bold text-base sm:text-lg hover:bg-glow-bright transition-all active:scale-[0.98] shadow-glow-sm">
                            Create Free Account
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </SignUpButton>
                </div>
            </section>

            {/* ── Footer ─ */}
            <footer className="py-8 sm:py-10 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <Logo className="text-3xl sm:text-4xl" fireflySize={36} />
                    <p className="text-xs sm:text-sm text-cream/40 text-center sm:text-right">
                        © {new Date().getFullYear()} Ecla Language Learning. Warmth, not guilt.
                    </p>
                </div>
            </footer>
        </main>
    )
}