import { isSceneDelivery, type SceneDelivery } from '../../../packages/contracts/scene'

const PREFIX = 'ecla:published-scene:'
const CATALOG_PREFIX = 'ecla:scene-catalog:'

export type SceneCatalogEntry = { slug: string; revisionId: string; title: string }

export function cachePublishedScene(slug: string, delivery: SceneDelivery) {
    if (typeof window === 'undefined' || !isSceneDelivery(delivery)) return
    try { localStorage.setItem(`${PREFIX}${slug}`, JSON.stringify(delivery)) } catch { /* storage may be disabled */ }
}

export function readPublishedScene(slug: string): SceneDelivery | null {
    if (typeof window === 'undefined') return null
    try { const value: unknown = JSON.parse(localStorage.getItem(`${PREFIX}${slug}`) ?? 'null'); return isSceneDelivery(value) ? value : null } catch { return null }
}

export function cacheSceneCatalog(competencyId: string, entries: SceneCatalogEntry[]) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(`${CATALOG_PREFIX}${competencyId}`, JSON.stringify(entries.slice(0, 20))) } catch { /* storage may be disabled */ }
}

export function readSceneCatalog(competencyId: string): SceneCatalogEntry[] | null {
    if (typeof window === 'undefined') return null
    try {
        const value: unknown = JSON.parse(localStorage.getItem(`${CATALOG_PREFIX}${competencyId}`) ?? 'null')
        if (!Array.isArray(value) || !value.every(row => row && typeof row.slug === 'string' && typeof row.revisionId === 'string' && typeof row.title === 'string')) return null
        return value
    } catch { return null }
}
