'use client'

/**
 * /course — the journey world (Phase 11.2).
 * Answers: "Where am I going, what will I learn, what can I already do?"
 * A competency graph rendered as a calm vertical journey — missions and
 * can-dos first, lessons invisible. The intelligence rail (adaptive next
 * mission + ability bands) reuses the dashboard kit.
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

    // "You are here": first unit with developing work, else first open unit.
    const hereId = course?.units.find(u => u.counts.developing > 0)?.id
        ?? course?.units.find(u => u.counts.upcoming > 0)?.id

    return (
        <AppShell>
            {!course ? (
                <p className="text-sm text-cream/60">No published course yet.</p>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* ── The journey ─ */}
                    <div className="lg:col-span-2">
                        <header className="mb-6">
                            <p className="text-[11px] uppercase tracking-widest text-glow">Spanish · {course.level}</p>
                            <h1 className="font-display mt-1 text-2xl font-bold text-cream md:text-3xl">{course.title}</h1>
                            <p className="mt-2 text-sm text-cream/50">
                                {mastered} demonstrated · {developing} developing · {all.length - mastered - developing} ahead
                            </p>
                        </header>

                        <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-4 before:top-8 before:w-px before:bg-white/10">
                            {course.units.map((u, i) => (
                                <StageCard key={u.id} unit={u} index={i} defaultOpen={u.id === hereId} />
                            ))}
                        </ol>
                    </div>

                    {/* ── Intelligence rail ─ */}
                    <div className="space-y-6">
                        {summary && <NextActionCard action={summary.nextAction} />}
                        {summary && <AbilityProfile dimensions={summary.dimensions} />}
                    </div>
                </div>
            )}
        </AppShell>
    )
}