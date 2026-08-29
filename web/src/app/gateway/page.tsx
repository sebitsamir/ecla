'use client'

/**
 * /gateway — Pre-A1 Gateway (Phase 15).
 * Landing shows honest readiness; simulation runs via GatewayPlayer.
 */
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, Check, Flag, Lock } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import GatewayPlayer from '@/components/ecla/GatewayPlayer'
import GraduationCard from '@/components/ecla/GraduationCard'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'
import type { GatewayEvidence } from '@/lib/gatewayTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type GComp = { id: string | number; code?: string; canDo?: string; status?: string }
type GUnit = { id: string | number; title?: string; description?: string; competencies?: GComp[] }

type Phase = 'landing' | 'playing' | 'graduated'

export default function GatewayPage() {
    const { getToken } = useAuth()
    const router = useRouter()
    const [summary, setSummary] = useState<LearnerSummary | null>(null)
    const [gateway, setGateway] = useState<GUnit | null>(null)
    const [loading, setLoading] = useState(true)
    const [phase, setPhase] = useState<Phase>('landing')
    const [evidence, setEvidence] = useState<GatewayEvidence[]>([])
    const [tick, setTick] = useState(0)

    useEffect(() => {
        const fn = () => setTick(t => t + 1)
        window.addEventListener('ecla:progress-updated', fn)
        return () => window.removeEventListener('ecla:progress-updated', fn)
    }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const [map, sum] = await Promise.all([
                    fetch(`${API_URL}/api/v1/course/map`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                    fetchSummary(getToken),
                ])
                const units: GUnit[] = map?.courses?.[0]?.units ?? []
                setGateway(units.find(u => /gateway/i.test(u.title ?? '')) ?? units[units.length - 1] ?? null)
                setSummary(sum)
            } catch { /* fail soft */ } finally { setLoading(false) }
        })()
    }, [getToken, tick])

    const handleGraduate = useCallback(async (ev: GatewayEvidence[]) => {
        setEvidence(ev)
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/gateway/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ evidence: ev }),
            })
            window.dispatchEvent(new Event('ecla:progress-updated'))
        } catch (e) {
            console.error('Gateway graduation save failed:', e)
        }
        setPhase('graduated')
    }, [getToken])

    if (phase === 'playing') {
        return <GatewayPlayer getToken={getToken} onGraduate={handleGraduate} />
    }

    if (phase === 'graduated') {
        return (
            <GraduationCard
                evidence={evidence}
                onContinue={() => router.push('/dashboard')}
            />
        )
    }

    const comps = gateway?.competencies ?? []
    const open = comps.filter(c => c.status !== 'locked')
    const gatewayReady = summary?.nextAction?.kind === 'gateway'
    const required = Math.max(0, (summary?.total ?? 0) - comps.length)
    const done = Math.min(summary?.demonstrated ?? 0, required)
    const pct = required ? Math.round((done / required) * 100) : 0

    return (
        <AppShell>
            {loading ? (
                <div className="space-y-4">
                    <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
                    <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
                </div>
            ) : (
                <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
                    <header className="text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-600/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-300">
                            <Flag className="h-3.5 w-3.5" /> Spanish · Pre-A1
                        </span>
                        <h1 className="font-display mt-4 text-3xl font-bold text-cream sm:text-4xl">
                            {gateway?.title ?? 'Pre-A1 Gateway'}
                        </h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream/55">
                            {gateway?.description ?? 'Six real situations. No hints. No scores until the end.'}
                        </p>
                    </header>

                    <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
                        <div className="mb-2 flex items-baseline justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-cream/50">Readiness</p>
                            <p className="text-xs font-bold text-cream/70">{done} / {required}</p>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-glow transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-cream/45">
                            {gatewayReady
                                ? 'The gateway is open. Six situations — one continuous simulation.'
                                : `Demonstrate ${Math.max(0, required - done)} more abilities to unlock the gateway.`}
                        </p>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream/50">What the gateway asks</p>
                        <ul className="space-y-3">
                            {comps.map(c => {
                                const unlocked = c.status !== 'locked'
                                return (
                                    <li key={c.id} className="flex items-start gap-3">
                                        <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                                            unlocked ? 'bg-leaf text-night-900' : 'border border-white/10 text-cream/30'
                                        }`}>
                                            {unlocked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Lock className="h-3 w-3" />}
                                        </span>
                                        <span className={`text-sm leading-snug ${unlocked ? 'text-cream/90' : 'text-cream/45'}`}>
                                            {c.canDo ?? c.code}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>

                    {gatewayReady ? (
                        <button
                            onClick={() => setPhase('playing')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-glow py-4 text-sm font-bold text-night-900 shadow-[0_0_30px_rgba(255,200,0,0.2)] transition-all hover:bg-glow/90 active:scale-[0.98]"
                        >
                            Begin simulation <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <p className="text-center text-xs text-cream/40">
                            The journey unlocks it — one real conversation at a time.
                        </p>
                    )}
                </div>
            )}
        </AppShell>
    )
}
