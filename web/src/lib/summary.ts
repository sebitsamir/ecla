/**
 * Client helper + types for learner API (Phase 11).
 */
import { apiFetch } from '@/lib/apiClient'
import type { ContinueUnit } from '@/components/ecla/dashboard/ContinueCards'
import type { CourseUnit } from '@/components/ecla/course/StageCard'

export type DimensionBand = { key: string; avg: number | null; band: string | null }
export type NextAction = {
    kind: 'lesson' | 'gateway' | 'review'
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

export type RetentionReview = { code: string; title: string; level: string; dueInHours: number }

export type LearnerHome = {
    summary: LearnerSummary
    courses: { level: string; title: string; units: CourseUnit[] }[]
    retentionReviews: RetentionReview[]
}

const CACHE_KEY = 'ecla:home'
const CACHE_TTL_MS = 30_000

type CacheEntry = { at: number; data: LearnerHome }

function readCache(): LearnerHome | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const hit = JSON.parse(raw) as CacheEntry
        if (Date.now() - hit.at > CACHE_TTL_MS) return null
        return hit.data
    } catch {
        return null
    }
}

function writeCache(data: LearnerHome) {
    if (typeof window === 'undefined') return
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
    } catch { /* quota */ }
}

export function invalidateHomeCache() {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(CACHE_KEY)
}

/** Single request for dashboard + course — cached 30s between navigations. */
export async function fetchHome(
    getToken: () => Promise<string | null>,
    { force = false } = {},
): Promise<LearnerHome> {
    if (!force) {
        const cached = readCache()
        if (cached) return cached
    }
    const data = await apiFetch<LearnerHome>('/api/v1/learner/home', getToken)
    writeCache(data)
    return data
}

export async function fetchSummary(getToken: () => Promise<string | null>): Promise<LearnerSummary> {
    const data = await apiFetch<{ summary: LearnerSummary }>('/api/v1/learner/summary', getToken)
    return data.summary
}

export type { ContinueUnit }

if (typeof window !== 'undefined') {
    window.addEventListener('ecla:progress-updated', () => invalidateHomeCache())
}
