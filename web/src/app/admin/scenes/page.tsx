'use client'
import { useState } from 'react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch } from '@/lib/apiClient'
import { isSceneDelivery, type SceneDelivery } from '../../../../../packages/contracts/scene'
import { SceneRenderer } from '@/components/scenes/SceneRenderer'

type Revision = { id: string; version: string; reviewedBy: string | null; publication: { revisionId: string } | null; source: unknown; events: { id: string; action: string; actor: string; note: string }[] }
const example = {
    contract: 'ecla.scene/1', schemaVersion: 1, slug: 'example-greeting', competencyCode: 'PA1.SOC.GRT.01',
    title: 'A greeting draft', setting: 'A doorway in the morning', objective: 'Practice a morning greeting.',
    purpose: 'practice', contextFingerprint: 'example-doorway', experiment: null,
    steps: [{ id: 'encounter', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'Listen to the greeting.', line: 'Buenos días.', translation: 'Good morning.', audio: { status: 'tts_fallback', locale: 'es-ES', rate: 0.9 } }],
}
export default function SceneAuthorPage() {
    const { getToken } = useAuthReady()
    const [source, setSource] = useState(JSON.stringify(example, null, 2))
    const [slug, setSlug] = useState('example-greeting')
    const [rows, setRows] = useState<Revision[]>([])
    const [preview, setPreview] = useState<SceneDelivery | null>(null)
    const [note, setNote] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const request = <T,>(path: string, body?: unknown) => apiFetch<T>(path, getToken, body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) })
    const load = async (target = slug) => {
        const result = await request<{ revisions: Revision[] }>(`/api/v1/admin/scenes/${encodeURIComponent(target)}/revisions`)
        setRows(result.revisions)
    }
    const run = async (action: () => Promise<void>) => {
        if (busy) return
        setBusy(true); setMessage(null)
        try { await action() } catch (error) { setMessage(error instanceof Error ? error.message : 'Authoring request failed') }
        finally { setBusy(false) }
    }
    const current = rows.find(row => row.publication)?.id ?? null
    const button = 'rounded-xl border border-white/20 px-4 py-2 disabled:opacity-40'
    return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream"><div className="mx-auto max-w-4xl space-y-6">
        <a href="/admin" className={button}>Back to admin</a>
        <h1 className="text-3xl font-bold">Canonical scene authoring</h1>
        <p>Admin access is enforced by the API. Drafts are immutable. Editorial review here is not educator validation or permission to award mastery.</p>
        {message && <p role="status" className="rounded-xl border border-amber-200/30 p-4">{message}</p>}
        <label className="block space-y-2"><span>Canonical source JSON</span><textarea className="h-96 w-full rounded-xl border border-white/20 bg-black/30 p-4 font-mono text-sm" value={source} onChange={event => setSource(event.target.value)} /></label>
        <div className="flex flex-wrap gap-3">
            <button disabled={busy} className={button} onClick={() => run(async () => { const result = await request<{ version: string }>('/api/v1/admin/scenes/validate', JSON.parse(source)); setMessage(`Valid. Content hash: ${result.version}`) })}>Validate</button>
            <button disabled={busy} className={button} onClick={() => run(async () => { const result = await request<{ source: unknown }>('/api/v1/admin/scenes/migrate', JSON.parse(source)); setSource(JSON.stringify(result.source, null, 2)); setMessage('Migrated in editor only. Save a new draft to persist.') })}>Migrate source to v1</button>
            <button disabled={busy} className={button} onClick={() => run(async () => { const input = JSON.parse(source); await request('/api/v1/admin/scenes/drafts', input); setSlug(input.slug); await load(input.slug); setMessage('Immutable draft saved; not published.') })}>Save new draft</button>
        </div>
        <div className="flex gap-3"><label>Scene slug<input className="ml-3 rounded-lg bg-white/10 p-2" value={slug} onChange={event => setSlug(event.target.value)} /></label><button className={button} disabled={busy} onClick={() => run(() => load())}>Load revisions</button></div>
        <label className="block">Editorial review note (describe your checks)<input className="mt-2 w-full rounded-lg bg-white/10 p-3" minLength={10} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} /></label>
        {rows.map(row => <article key={row.id} className="space-y-3 rounded-xl border border-white/20 p-4">
            <p className="break-all font-mono text-xs">{row.version}</p><p>{row.publication ? 'Published' : row.reviewedBy ? 'Reviewed, not currently published' : 'Draft: review pending'}</p>
            <div className="flex flex-wrap gap-3">
                <button className={button} disabled={busy} onClick={() => { setSource(JSON.stringify(row.source, null, 2)); setMessage('Editing creates a new revision when saved.') }}>Edit as new draft</button>
                <button className={button} disabled={busy} onClick={() => run(async () => { const result = await request<unknown>(`/api/v1/admin/scene-revisions/${row.id}/preview`); if (!isSceneDelivery(result)) throw new Error('Invalid preview contract'); setPreview(result) })}>Preview</button>
                <button className={button} disabled={busy || !!row.reviewedBy || note.trim().length < 10} onClick={() => run(async () => { await request(`/api/v1/admin/scene-revisions/${row.id}/review`, { note }); await load() })}>Confirm editorial review</button>
                <button className={button} disabled={busy || !row.reviewedBy || !!row.publication} onClick={() => run(async () => { await request(`/api/v1/admin/scene-revisions/${row.id}/publish`, { expectedRevisionId: current }); await load(); setMessage('Published this exact revision.') })}>Publish this revision</button>
                {row.publication && <button className={button} disabled={busy} onClick={() => run(async () => { await request(`/api/v1/admin/scene-revisions/${row.id}/unpublish`, {}); await load() })}>Unpublish</button>}
            </div>
            <details><summary>Audit history</summary>{row.events.map(event => <p key={event.id} className="text-sm">{event.action} · {event.actor} · {event.note}</p>)}</details>
        </article>)}
        {preview && <SceneRenderer key={preview.revisionId} delivery={preview} preview onExit={() => setPreview(null)} />}
    </div></main>
}
