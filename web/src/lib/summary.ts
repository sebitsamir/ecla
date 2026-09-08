/**
 * Client helper + types for learner API (Phase 11).
 */
import { apiFetch } from '@/lib/apiClient'
import type { ContinueUnit } from '@/components/ecla/dashboard/ContinueCards'
import type { CourseUnit } from '@/components/ecla/course/StageCard'
import type { AdaptationPlan } from '../../../packages/contracts/adaptation'

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
    adaptation: AdaptationPlan
}

const CACHE_PREFIX = 'ecla:home:'
const CACHE_TTL_MS = 30_000
const pending = new Map<string, Promise<LearnerHome>>()

type CacheEntry = { at: number; data: LearnerHome }

function cacheKey(userId: string) { return `${CACHE_PREFIX}${userId}` }

function readCache(userId: string): LearnerHome | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem(cacheKey(userId))
        if (!raw) return null
        const hit = JSON.parse(raw) as CacheEntry
        if (Date.now() - hit.at > CACHE_TTL_MS) return null
        return hit.data
    } catch {
        return null
    }
}

function writeCache(userId: string, data: LearnerHome) {
    if (typeof window === 'undefined') return
    try {
        sessionStorage.setItem(cacheKey(userId), JSON.stringify({ at: Date.now(), data }))
    } catch { /* quota */ }
}

export function invalidateHomeCache(userId?: string) {
    if (typeof window === 'undefined') return
    if (userId) sessionStorage.removeItem(cacheKey(userId))
    else for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = sessionStorage.key(index)
        if (key?.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(key)
    }
}

/** Single request for dashboard + course — cached 30s between navigations. */
export async function fetchHome(
    getToken: () => Promise<string | null>,
    { force = false, userId }: { force?: boolean; userId: string },
): Promise<LearnerHome> {
    if (!force) {
        const cached = readCache(userId)
        if (cached) return cached
        const active = pending.get(userId)
        if (active) return active
    }
    const request = apiFetch<LearnerHome>('/api/v1/learner/home', getToken).then(data => { writeCache(userId, data); return data })
    pending.set(userId, request)
    try { return await request } finally { if (pending.get(userId) === request) pending.delete(userId) }
}

export async function fetchSummary(getToken: () => Promise<string | null>): Promise<LearnerSummary> {
    const data = await apiFetch<{ summary: LearnerSummary }>('/api/v1/learner/summary', getToken)
    return data.summary
}

export type { ContinueUnit }

if (typeof window !== 'undefined') {
    window.addEventListener('ecla:progress-updated', () => invalidateHomeCache())
}
