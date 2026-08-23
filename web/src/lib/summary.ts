/**
 * Client helper + types for GET /api/v1/learner/summary (Phase 11).
 * Fails soft: the dashboard renders an error card, never a crash.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export type DimensionBand = { key: string; avg: number | null; band: string | null }
export type NextAction = {
    kind: 'lesson' | 'gateway'
    competencyId?: string; code?: string
    title: string; canDo: string; mode?: string; href: string; reason: string
}
export type DueReview = { id: string; code: string; title: string; canDo: string }
export type UnitCard = { id: string; title: string; demonstrated: number; total: number; href: string | null }
export type WeekStats = { demonstrated: number; conversations: number; repairs: number }

export type LearnerSummary = {
    name: string | null
    demonstrated: number
    total: number
    week: WeekStats
    dimensions: DimensionBand[]
    dueReviews: DueReview[]
    nextAction: NextAction
    units: UnitCard[]
}

export async function fetchSummary(getToken: () => Promise<string | null>): Promise<LearnerSummary | null> {
    try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/v1/learner/summary`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.summary as LearnerSummary
    } catch {
        return null
    }
}