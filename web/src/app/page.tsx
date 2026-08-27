'use client'

/**
 * / — Landing: marketing & conversion (premium redesign).
 * Flat surfaces · hairline borders · amber brand light · no noise.
 * Sections: hero · differentiators · four modes · meet Ecla · CTA · footer.
 * Clerk modals handle auth; signed-in users auto-redirect to /dashboard.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs'
import {
    ArrowRight, BookOpen, CheckCircle2, Flame, GraduationCap,
    Heart, Mic, Music, Shield, Sparkles, Zap, MessageCircle,
} from 'lucide-react'
import Link from 'next/link'

/** Learning mode showcase — same curriculum, four experiences. */
const modes = [
    {
        id: 'STORY',
        label: 'Story',
        tagline: 'Learn through narrative',
        desc: 'Master vocabulary and grammar naturally through engaging, bite-sized scenes. Context makes it stick.',
        Icon: BookOpen,
        accent: '#FFB45A',
    },
    {
        id: 'DRILL',
        label: 'Drill',
        tagline: 'Rapid-fire practice',
        desc: 'Fast-paced, focused repetition to build muscle memory. Perfect for quick 5-minute sessions.',
        Icon: Zap,
        accent: '#4DD8E6',
    },
    {
        id: 'IMMERSION',
        label: 'Immersion',
        tagline: 'Culture & native speech',
        desc: 'Understand the idioms, humor, and cultural context that textbooks leave out.',
        Icon: Music,
        accent: '#B98CF0',
    },
    {
        id: 'PROFESSIONAL',
        label: 'Professional',
        tagline: 'Formal & workplace',
        desc: 'Master business vocabulary, workplace etiquette, and speak with confidence in any career setting.',
        Icon: GraduationCap,
        accent: '#7FA6FF',
    },
]

/** Product differentiators — emotional benefits that set Ecla apart. */
const differentiators = [
    {
        Icon: Heart,
        title: 'Warmth, not guilt',
        desc: 'No shaming notifications. No streak resets that make you quit. Ecla rewards consistency with light, not punishment.',
    },
    {
        Icon: Flame,
        title: 'Cinematic scenes, not flashcards',
        desc: 'Every lesson is a living scene — a café in Madrid, a street at dusk. You learn by doing, not by memorizing lists.',
    },
    {
        Icon: Shield,
        title: 'Invisible adaptation',
        desc: 'Scaffolding fades as you grow. Hints recede, challenges appear. The system watches, but never judges.',
    },
]

export default function LandingPage() {
    const router = useRouter()
    const { isSignedIn } = useAuth()

    /** Auto-redirect authenticated users to dashboard. */
    useEffect(() => {
        if (isSignedIn) {
            router.push('/dashboard')
        }
    }, [isSignedIn, router])

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <main className="min-h-screen bg-[#0B0B10] font-body text-cream selection:bg-glow/30 selection:text-night-900">
            <style>{`
                @keyframes gentle-float { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(-8px); } 
                }
                .gentle-float { animation: gentle-float 8s ease-in-out infinite; }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in-up { animation: fade-in-up 0.6s ease-out; }
                
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.6; }
                }
                .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
            `}</style>

            {/* ── Navigation Header ─ */}
            <header className="sticky top-0 z-50 bg-[#0B0B10]/90 backdrop-blur border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
                        <span className="font-display text-base sm:text-lg font-bold text-cream tracking-tight">ECLA</span>
                        <span className="hidden sm:block text-[10px] uppercase tracking-widest text-cream/40">Speak · Understand · Use</span>
                    </Link>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <SignInButton mode="modal">
                            <button className="inline-flex px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-cream/70 hover:text-cream transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-glow text-night-900 text-xs sm:text-sm font-bold hover:bg-glow/90 transition-all active:scale-[0.98]">
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
                                Ditch the guilt-driven streaks and robotic drills. <span className="text-cream font-semibold">Ecla adapts to how you learn</span> — with cinematic scenes, invisible scaffolding, and a voice tutor that feels like a real conversation.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mb-8 sm:mb-12">
                                <SignUpButton mode="modal">
                                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-glow text-night-900 font-bold text-sm sm:text-base hover:bg-glow/90 transition-all active:scale-[0.98]">
                                        Start Learning Free
                                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </SignUpButton>
                                <button
                                    onClick={() => scrollToSection('modes')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/15 bg-[#13131B] text-cream font-semibold text-sm sm:text-base hover:bg-white/5 hover:border-white/25 transition-all active:scale-[0.98]"
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

                        {/* Right: Amber glow orb (replaces Firefly) */}
                        <div className="relative flex items-center justify-center lg:justify-end order-first lg:order-last mb-8 lg:mb-0">
                            <div className="relative gentle-float">
                                <div className="absolute inset-0 blur-[80px] sm:blur-[100px] opacity-40 pulse-glow bg-glow/30 rounded-full" />
                                <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-gradient-to-br from-glow/20 to-amber-600/10 border border-glow/20 flex items-center justify-center">
                                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-glow to-amber-600/50 blur-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Differentiators Section ─ */}
            <section className="relative py-16 sm:py-24 lg:py-32 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        {differentiators.map((d, index) => (
                            <div
                                key={d.title}
                                className="group rounded-2xl border border-white/10 bg-[#13131B] p-6 sm:p-8 hover:border-glow/30 transition-all duration-300"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <d.Icon className="h-5 w-5 sm:h-6 sm:w-6 text-glow" />
                                </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                        {modes.map((mode, index) => (
                            <div
                                key={mode.id}
                                className="group rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6 hover:border-white/20 transition-all duration-300 cursor-pointer"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="relative">
                                    <div
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border border-current/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300"
                                        style={{ color: mode.accent, backgroundColor: `${mode.accent}15` }}
                                    >
                                        <mode.Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>

                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: mode.accent }}>
                                        {mode.label} Mode
                                    </p>
                                    
                                    <h3 className="font-display text-base sm:text-lg font-bold text-cream mb-2 sm:mb-3">{mode.tagline}</h3>
                                    
                                    <p className="text-cream/60 leading-relaxed text-xs sm:text-sm mb-4 sm:mb-6">{mode.desc}</p>

                                    <div
                                        className="flex items-center gap-1 text-xs sm:text-sm font-semibold group-hover:gap-2 transition-all duration-300"
                                        style={{ color: mode.accent }}
                                    >
                                        Explore <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Voice Tutor Section ─ */}
            <section className="relative py-16 sm:py-24 lg:py-32 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Visual */}
                        <div className="relative flex items-center justify-center order-2 lg:order-1">
                            <div className="relative gentle-float">
                                <div className="absolute inset-0 blur-[100px] sm:blur-[120px] opacity-30 pulse-glow bg-violet-500/20 rounded-full" />
                                <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center">
                                    <MessageCircle className="h-24 w-24 sm:h-32 sm:w-32 text-violet-300/50" />
                                </div>
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="order-1 lg:order-2 text-center lg:text-left">
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-violet-300 mb-3 sm:mb-4">Meet Ecla</p>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-cream mb-4 sm:mb-6">
                                Your AI tutor, <br className="hidden sm:block" />
                                <span className="text-violet-300">always ready.</span>
                            </h2>
                            <p className="text-cream/60 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                                Ecla isn't just a mascot — she's your companion. Type or speak in Spanish, get instant feedback, and practice real conversations without the pressure of a human tutor.
                            </p>
                            
                            <ul className="space-y-3 sm:space-y-4 text-left max-w-md mx-auto lg:mx-0">
                                {[
                                    'Real-time voice conversations',
                                    'Bilingual display with instant translations',
                                    'Adapts to your level and goals',
                                    'Available 24/7, no judgment',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 sm:gap-3 text-cream/70 text-sm sm:text-base">
                                        <div className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-violet-300" />
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
                    <div className="relative inline-block mb-8 sm:mb-10">
                        <div className="absolute inset-0 blur-[60px] sm:blur-[80px] opacity-30 pulse-glow bg-glow/30 rounded-full" />
                        <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-glow/20 to-amber-600/10 border border-glow/20 flex items-center justify-center">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-glow to-amber-600/50 blur-md" />
                        </div>
                    </div>
                    
                    <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-cream mb-4 sm:mb-6 leading-tight">
                        Ready to find <br className="sm:hidden" />
                        <span className="text-glow">your fluency?</span>
                    </h2>
                    
                    <p className="text-cream/60 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
                        Join the exclusive Ecla beta. Shape the future of language learning and keep your glow forever.
                    </p>
                    
                    <SignUpButton mode="modal">
                        <button className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-glow text-night-900 font-bold text-base sm:text-lg hover:bg-glow/90 transition-all active:scale-[0.98]">
                            Create Free Account
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </SignUpButton>
                </div>
            </section>

            {/* ─ Footer ─ */}
            <footer className="py-8 sm:py-10 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-bold text-cream">ECLA</span>
                        <span className="text-[10px] uppercase tracking-widest text-cream/40">Speak · Understand · Use</span>
                    </div>
                    <p className="text-xs sm:text-sm text-cream/40 text-center sm:text-right">
                        © {new Date().getFullYear()} Ecla Language Learning. Warmth, not guilt.
                    </p>
                </div>
            </footer>
        </main>
    )
}