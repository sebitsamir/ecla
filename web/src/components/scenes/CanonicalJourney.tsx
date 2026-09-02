'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { isSceneDelivery, type SceneDelivery } from '../../../../packages/contracts/scene'
import { SceneRenderer } from './SceneRenderer'
import { cachePublishedScene, cacheSceneCatalog, readPublishedScene, readSceneCatalog, type SceneCatalogEntry as Entry } from '@/lib/sceneCache'
export default function CanonicalJourney({ competencyId, getToken, onExit }: { competencyId: string; getToken: () => Promise<string | null>; onExit: () => void }) {
    const [scenes, setScenes] = useState<Entry[] | null>(null)
    const [delivery, setDelivery] = useState<SceneDelivery | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [offline, setOffline] = useState(false)
    const pending = useRef(false)
    const keys = useRef(new Map<string, string>())
    const fetchCatalog = useCallback(() => apiFetch<{ scenes: Entry[] }>(`/api/v1/scenes?competencyId=${encodeURIComponent(competencyId)}`, getToken), [competencyId, getToken])
    const load = async () => { const result = await fetchCatalog(); cacheSceneCatalog(competencyId, result.scenes); setOffline(false); setScenes(result.scenes) }
    useEffect(() => {
        let cancelled = false
        fetchCatalog().then(response => { cacheSceneCatalog(competencyId, response.scenes); if (!cancelled) { setOffline(false); setScenes(response.scenes) } }).catch(reason => { const cached = readSceneCatalog(competencyId); if (!cancelled && cached) { setOffline(true); setScenes(cached) } else if (!cancelled) setError(reason.message) })
        return () => { cancelled = true }
    }, [fetchCatalog, competencyId])
    const open = async (slug: string) => {
        if (pending.current) return
        pending.current = true; setBusy(true); setError(null)
        try {
            const response = await apiFetch<unknown>(`/api/v1/scenes/${encodeURIComponent(slug)}`, getToken)
            if (!isSceneDelivery(response)) throw new Error('Unsupported scene document. Refresh or contact the author.')
            const requestKey = keys.current.get(response.revisionId) ?? crypto.randomUUID()
            keys.current.set(response.revisionId, requestKey)
            cachePublishedScene(slug, response)
            setOffline(false)
            setDelivery(response)
            // Practice visit telemetry must not delay the first interactive turn.
            void apiFetch('/api/v1/scene-visits', getToken, { method: 'POST', body: JSON.stringify({ revisionId: response.revisionId, requestKey }) }).catch(() => undefined)
        } catch (reason) { const cached = readPublishedScene(slug); if (cached) { setOffline(true); setDelivery(cached) } else setError(reason instanceof Error ? reason.message : 'Could not open scene') }
        finally { pending.current = false; setBusy(false) }
    }
    if (delivery) return <main className="min-h-screen bg-[#0B0B10] p-6"><SceneRenderer key={delivery.revisionId} delivery={delivery} onExit={() => setDelivery(null)} /></main>
    return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream"><div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-bold">Published practice scenes</h1>
        <p>These scenes come from reviewed, versioned server content. Practice does not award XP or mastery.</p>
        {offline && <p role="status" className="rounded-xl border border-amber-200/20 p-3 text-sm text-amber-100">Offline practice copy. Responses are not evaluated or saved; reconnect before an assessment.</p>}
        {error && <p role="alert">{error}</p>}
        {scenes === null && !error && <p role="status">Loading…</p>}
        {scenes?.length === 0 && <p role="status">No canonical scene has been published for this competency yet. Content must be migrated and reviewed before it appears here.</p>}
        {scenes?.map(scene => <button key={scene.revisionId} disabled={busy} className="block w-full rounded-xl border border-white/20 p-4 text-left disabled:opacity-40" onClick={() => open(scene.slug)}>{scene.title}</button>)}
        <button onClick={() => { setError(null); load().catch(reason => setError(reason.message)) }} className="rounded-xl border px-4 py-2">Refresh scenes</button>
        <button onClick={onExit} className="ml-3 rounded-xl border px-4 py-2">Back to course</button>
    </div></main>
}
