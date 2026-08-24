'use client'

/**
 * /course — the journey world (Phase 11.2, polished).
 * Responsive: mobile = mission → journey → ability; desktop = journey + sticky rail.
 * Flat surfaces only; the rail never stretches to the journey's height.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import StageCard, { type CourseUnit } from '@/components/ecla/course/StageCard'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import NextActionCard from '@/components/ecla/dashboard/NextActionCard'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type CourseData = { courses: { level: string; title: string; units: CourseUnit[] }[] }

function Stat({ value, label, tone }: { value: number; label: string; tone: 'leaf' | 'glow' | 'muted' }) {
    const color = tone === 'leaf' ? 'text-leaf' : tone === 'glow' ? 'text-glow' : 'text-cream/60'
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#13131B] px-3 py-1 text-xs text-cream/50">
            <span className={`font-bold ${color}`}>{value}</span> {label}
        </span>
    )
}

export default function CoursePage() {
    const { getToken } = useAuth()
    const [data, setData] = useState<CourseData | null>(null)
    const [summary, setSummary] = useState<LearnerSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const [courseJson, sum] = await Promise.all([
                    fetch(`${API_URL}/api/v1/course/map`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                    fetchSummary(getToken),
                ])
                setData(courseJson)
                setSummary(sum)
            } catch { /* fail soft */ } finally { setLoading(false) }
        })()
    }, [getToken])

    if (loading) {
        return (
            <AppShell>
                <div className="space-y-4">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
            </AppShell>
        )
    }

    const course = data?.courses?.[0]
    const all = (course?.units ?? []).flatMap(u => u.competencies)
    const mastered = all.filter(c => c.status === 'mastered').length
    const developing = all.filter(c => c.status === 'developing').length
    const ahead = all.length - mastered - developing

    // "You are here": first unit with developing work, else first open unit.
    const hereId = course?.units.find(u => u.counts.developing > 0)?.id
        ?? course?.units.find(u => u.counts.upcoming > 0)?.id

    return (
        <AppShell>
            {!course ? (
                <p className="text-sm text-cream/60">No published course yet.</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                    {/* ── The journey ─ */}
                    <div className="order-2 min-w-0 xl:order-1">
                        <header className="mb-6">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">
                                Spanish · {course.level}
                            </p>
                            <h1 className="font-display mt-1 text-2xl font-bold text-cream md:text-3xl">
                                {course.title}
                            </h1>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Stat value={mastered} label="demonstrated" tone="leaf" />
                                <Stat value={developing} label="developing" tone="glow" />
                                <Stat value={ahead} label="ahead" tone="muted" />
                            </div>
                        </header>

                        <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-4 before:top-8 before:w-px before:bg-white/10">
                            {course.units.map((u, i) => (
                                <StageCard key={u.id} unit={u} index={i} defaultOpen={u.id === hereId} />
                            ))}
                        </ol>
                    </div>

                    {/* ── Intelligence rail (sticky on desktop, on top for mobile) ─ */}
                    <aside className="order-1 min-w-0 space-y-6 xl:order-2 xl:sticky xl:top-20">
                        {summary && <NextActionCard action={summary.nextAction} />}
                        {summary && (
                            <div className="hidden xl:block">
                                <AbilityProfile dimensions={summary.dimensions} />
                            </div>
                        )}
                    </aside>

                    {/* Ability profile sits after the journey on < xl */}
                    {summary && (
                        <div className="min-w-0 xl:hidden">
                            <AbilityProfile dimensions={summary.dimensions} />
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    )
}