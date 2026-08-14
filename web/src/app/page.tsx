'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs'
import {
    BookOpen, Zap, Music, GraduationCap,
    CheckCircle2, ArrowRight, Globe, Sparkles, ArrowUpRight
} from 'lucide-react'

export default function LandingPage() {
    const router = useRouter()
    const { isSignedIn } = useAuth()

    // Redirect authenticated users straight to the dashboard
    useEffect(() => {
        if (isSignedIn) {
            router.push('/dashboard')
        }
    }, [isSignedIn, router])

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/20">
            {/* Crisp, Minimal Navigation */}
            <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">Luma</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <SignInButton mode="modal">
                            <button className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition-colors active:scale-[0.98]">
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </SignUpButton>
                    </div>
                </div>
            </header>

            {/* Hero Section: Strict Typography & High Contrast */}
            <section className="pt-32 pb-24 border-b border-zinc-800">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Now in Exclusive Beta
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
                        Master a new language, <br className="hidden sm:block" />
                        <span className="text-zinc-400">your way.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Ditch the repetitive, one-size-fits-all drills. Luma adapts to how you learn best with four distinct, context-rich modes designed for real-world fluency.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <SignUpButton mode="modal">
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base transition-colors active:scale-[0.98]">
                                Start Learning for Free
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </SignUpButton>
                        <button
                            onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-base hover:bg-zinc-800 hover:text-white transition-colors active:scale-[0.98]"
                        >
                            See How It Works
                        </button>
                    </div>

                    {/* Clean Social Proof */}
                    <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-zinc-500 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>AI-powered context</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Spaced repetition</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* The 4 Modes Section: Premium Feature Grid */}
            <section id="modes" className="py-24 bg-zinc-950">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="max-w-3xl mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                            One curriculum. Four ways to learn.
                        </h2>
                        <p className="text-lg text-zinc-400">
                            Switch between modes instantly based on your mood, goals, or the time of day.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Story Mode */}
                        <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                                <BookOpen className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Story Mode</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                Learn vocabulary and grammar naturally through engaging, bite-sized narratives. Context is everything, and stories make it stick.
                            </p>
                            <div className="flex items-center gap-1 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                                Learn more <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Drill Mode */}
                        <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Drill Mode</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                Fast-paced, focused repetition to build muscle memory. Perfect for quick, 5-minute sessions to reinforce what you've learned.
                            </p>
                            <div className="flex items-center gap-1 text-sm font-medium text-yellow-400 group-hover:text-yellow-300 transition-colors">
                                Learn more <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Immersion Mode */}
                        <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                                <Music className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Immersion Mode</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                Understand the cultural context behind the language. Learn the idioms, humor, and real-world usage that textbooks leave out.
                            </p>
                            <div className="flex items-center gap-1 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                                Learn more <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Professional Mode */}
                        <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                                <GraduationCap className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Professional Mode</h3>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                Master formal vocabulary, business etiquette, and professional communication. Speak with confidence in any workplace.
                            </p>
                            <div className="flex items-center gap-1 text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                Learn more <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section: Clean & Direct */}
            <section className="py-24 border-t border-zinc-800 bg-zinc-950">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-8" />
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
                        Ready to find your fluency?
                    </h2>
                    <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
                        Join the exclusive Luma beta today. Shape the future of language learning and get lifetime access to premium features.
                    </p>
                    <SignUpButton mode="modal">
                        <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-zinc-950 font-bold text-lg hover:bg-zinc-200 transition-colors active:scale-[0.98]">
                            Create Free Account
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </SignUpButton>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="py-8 bg-zinc-950 border-t border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-300">Luma</span>
                    </div>
                    <p className="text-sm text-zinc-600">
                        © {new Date().getFullYear()} Luma Language Learning. All rights reserved.
                    </p>
                </div>
            </footer>
        </main>
    )
}