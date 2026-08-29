'use client'

/**
 * /course — the journey world (Phase D premium pass).
 * Calm vertical journey left · intelligence rail right.
 * Refetches on 'ecla:progress-updated' so mastery flips live.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import StageCard, { type CourseUnit } from '@/components/ecla/course/StageCard'
import CompetencyDetail, { type CompetencyEvidence } from '@/components/ecla/course/CompetencyDetail'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import NextActionCard from '@/components/ecla/dashboard/NextActionCard'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type CourseData = { courses: { level: string; title: string; units: CourseUnit[] }[] }

export default function CoursePage() {
    const { getToken } = useAuth()
    const [data, setData] = useState<CourseData | null>(null)
    const [summary, setSummary] = useState<LearnerSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [tick, setTick] = useState(0)
    const [selected, setSelected] = useState<CompetencyEvidence | null>(null)

    useEffect(() => {
        const fn = () => setTick(t => t + 1)
        window.addEventListener('ecla:progress-updated', fn)
        return () => window.removeEventListener('ecla:progress-updated', fn)
    }, [])

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
    }, [getToken, tick])

    if (loading) {
        return (
            <AppShell>
                <div className="space-y-4">
                    <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
            </AppShell>
        )
    }

    const course = data?.courses?.[0]
    const all = (course?.units ?? []).flatMap(u => u.competencies ?? [])
    const mastered = all.filter(c => c.status === 'mastered').length
    const developing = all.filter(c => c.status === 'developing').length
    const ahead = all.length - mastered - developing

    const hereId = course?.units.find(u => (u.counts?.developing ?? 0) > 0)?.id
        ?? course?.units.find(u => (u.counts?.upcoming ?? 0) > 0)?.id

    const graphNodes = (course?.units ?? []).flatMap(u => u.competencies ?? [])

    return (
        <AppShell>
            {!course ? (
                <p className="text-sm text-cream/60">No published course yet.</p>
            ) : (
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                    {/* ── The journey ── */}
                    <div className="min-w-0">
                        <header className="mb-6 sm:mb-8">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">
                                Spanish · {String(course.level).replace(/_/g, '-')}
                            </p>
                            <h1 className="font-display mt-1 text-2xl font-bold text-cream sm:text-3xl md:text-4xl">
                                {course.title}
                            </h1>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-[11px] font-semibold text-leaf">
                                    {mastered} demonstrated
                                </span>
                                <span className="rounded-full border border-glow/30 bg-glow/10 px-3 py-1 text-[11px] font-semibold text-glow">
                                    {developing} developing
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-cream/50">
                                    {ahead} ahead
                                </span>
                            </div>
                        </header>

                        <ol className="space-y-3 sm:space-y-4">
                            {course.units.map((u, i) => (
                                <StageCard
                                    key={u.id}
                                    unit={u}
                                    index={i}
                                    defaultOpen={u.id === hereId}
                                    onSelect={cp => setSelected({
                                        id: cp.id,
                                        code: cp.code,
                                        canDo: cp.canDo,
                                        status: cp.status,
                                        patterns: cp.patterns,
                                        evidence: cp.evidence ?? undefined,
                                    })}
                                />
                            ))}
                        </ol>
                    </div>

                    {/* ── Intelligence rail ── */}
                    <div className="min-w-0 space-y-5 xl:sticky xl:top-20 xl:self-start">
                        {summary && <NextActionCard action={summary.nextAction} />}
                        <CompetencyDetail competency={selected ?? (graphNodes[0] ? {
                            id: graphNodes[0].id,
                            code: graphNodes[0].code,
                            canDo: graphNodes[0].canDo,
                            status: graphNodes[0].status,
                            patterns: graphNodes[0].patterns,
                            evidence: graphNodes[0].evidence ?? undefined,
                        } : null)} />
                        {summary && <AbilityProfile dimensions={summary.dimensions} />}
                    </div>
                </div>
            )}
        </AppShell>
    )
}