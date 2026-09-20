'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { isSceneDelivery, type SceneDelivery } from '../../../../packages/contracts/scene'
import { SceneRenderer } from './SceneRenderer'
import { cachePublishedScene, cacheSceneCatalog, readPublishedScene, readSceneCatalog, type SceneCatalogEntry as Entry } from '@/lib/sceneCache'
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles } from 'lucide-react'
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
    if (delivery) return <SceneRenderer key={delivery.revisionId} delivery={delivery} onExit={() => setDelivery(null)} />
    return <main className="min-h-dvh bg-obsidian/70 px-4 py-6 text-ivory sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between"><button onClick={onExit} className="ecla-control inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm text-stone hover:text-ivory"><ArrowLeft className="size-4" />Course</button><span className="inline-flex items-center gap-2 text-xs text-stone"><Sparkles className="size-4 text-ember-soft" />Interactive practice</span></header>
        <div className="max-w-2xl pb-8 pt-14 sm:pt-20"><p className="text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">Conversation practice</p><h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">Step into the language.</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-stone">Choose a scene and respond in context. Every installed competency is available to practise.</p></div>
        {offline && <p role="status" className="mb-5 rounded-control border border-warning/30 bg-warning/10 p-4 text-sm text-ivory">You are viewing an offline practice copy. Reconnect before an assessment.</p>}
        {error && <div role="alert" className="mb-5 rounded-control border border-danger/40 bg-danger/10 p-4 text-danger-soft">{error}</div>}
        {scenes === null && !error && <div role="status" className="grid gap-4 sm:grid-cols-2">{[0,1].map(item => <div key={item} className="ecla-skeleton h-40 rounded-experience" />)}</div>}
        {scenes?.length === 0 && <div role="status" className="ecla-surface rounded-experience p-7 text-stone">This competency has no installed scene yet. Run the scene seed to add it.</div>}
        <div className="grid gap-4 sm:grid-cols-2">{scenes?.map((scene, index) => <button key={scene.revisionId} disabled={busy} className="ecla-control group relative min-h-44 overflow-hidden rounded-experience border border-line-strong bg-carbon p-6 text-left shadow-glow-md hover:-translate-y-0.5 hover:border-ember/50 disabled:opacity-40" onClick={() => open(scene.slug)}>
            <div className="relative flex h-full flex-col justify-between"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">Scene {String(index + 1).padStart(2,'0')}</p><div><h2 className="font-display text-2xl text-ivory">{scene.title}</h2><p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-stone group-hover:text-ivory">Enter scene <ArrowRight className="size-4" /></p></div></div>
        </button>)}</div>
        <button onClick={() => { setError(null); load().catch(reason => setError(reason.message)) }} className="ecla-control mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm text-stone hover:text-ivory"><RefreshCw className="size-4" />Refresh scenes</button>
    </div></main>
}
