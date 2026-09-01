'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch } from '@/lib/apiClient'

type Decision = { id: string; kind: 'cultural' | 'native_speaker'; decision: 'approved' | 'rejected'; reviewerId: string; reviewerQualification: string; note: string; createdAt: string }
type Context = { slug: string; setting: string; partner: string; opening: string; learnerGoal: string; variation: string }
type Item = {
    code: string; contentVersion: string; realization: { core: string[]; acceptedMeaningVariants: string[] }; contexts: Context[]
    listening: { speaker: string; locale: string; rate: number; line: string }[]
    production: { spoken: string; written: string }; interaction: string; repair: { trigger: string; strategy: string }
    transfer: { contextSlug: string; novelty: string }; retention: { delayHours: number; prompt: string }; cultureNote: string
    reviews: { cultural: Decision | null; native_speaker: Decision | null }; blockers: string[]; history: Decision[]
}
type Catalog = { totalSlots: number; approvedSlots: number; remainingSlots: number; publishableCompetencies: number; items: Item[] }
type ReviewKind = 'cultural' | 'native_speaker'

const blank = { qualification: '', note: '' }
export default function PortfolioReviewPage() {
    const { getToken } = useAuthReady()
    const [catalog, setCatalog] = useState<Catalog | null>(null)
    const [selectedCode, setSelectedCode] = useState<string>('')
    const [forms, setForms] = useState<Record<ReviewKind, typeof blank>>({ cultural: { ...blank }, native_speaker: { ...blank } })
    const [showComplete, setShowComplete] = useState(false)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const load = useCallback(async () => {
        const result = await apiFetch<Catalog>('/api/v1/admin/pre-a1-portfolio', getToken)
        setCatalog(result)
    }, [getToken])
    useEffect(() => {
        let active = true
        apiFetch<Catalog>('/api/v1/admin/pre-a1-portfolio', getToken)
            .then(result => { if (active) setCatalog(result) })
            .catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Could not load reviews') })
        return () => { active = false }
    }, [getToken])
    const visible = useMemo(() => catalog?.items.filter(item => showComplete || item.blockers.length > 0) ?? [], [catalog, showComplete])
    const selected = catalog?.items.find(item => item.code === selectedCode) ?? visible[0] ?? null
    const decide = async (kind: ReviewKind, decision: 'approved' | 'rejected') => {
        if (!selected || busy) return
        const form = forms[kind]
        setBusy(true); setMessage(null)
        try {
            await apiFetch(`/api/v1/admin/pre-a1-portfolio/${encodeURIComponent(selected.code)}/reviews`, getToken, { method: 'POST', body: JSON.stringify({ kind, decision, expectedContentVersion: selected.contentVersion, reviewerQualification: form.qualification, note: form.note, requestKey: crypto.randomUUID() }) })
            setForms(current => ({ ...current, [kind]: { ...blank } }))
            await load(); setMessage(`${kind === 'cultural' ? 'Cultural' : 'Native-speaker'} decision recorded.`)
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Review failed') }
        finally { setBusy(false) }
    }
    const button = 'rounded-xl border border-white/20 px-4 py-2 text-sm disabled:opacity-40'
    return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream"><div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-3"><a href="/admin" className={button}>Back to admin</a><h1 className="text-3xl font-bold">Pre-A1 independent review</h1><p className="text-cream/60">Review the exact authored content version. Approval records are append-only; a later decision supersedes the earlier one without deleting history.</p></header>
        {catalog && <section className="grid gap-3 sm:grid-cols-4">{[[catalog.approvedSlots,'Approved slots'],[catalog.remainingSlots,'Remaining slots'],[catalog.totalSlots,'Total slots'],[catalog.publishableCompetencies,'Publishable competencies']].map(([value,label]) => <div key={label} className="rounded-xl border border-white/10 p-4"><p className="text-2xl font-bold text-glow">{value}</p><p className="text-xs text-cream/50">{label}</p></div>)}</section>}
        {message && <p role="status" className="rounded-xl border border-amber-300/30 p-3">{message}</p>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showComplete} onChange={event => setShowComplete(event.target.checked)} /> Show competencies with both approvals</label>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="max-h-[75vh] overflow-y-auto rounded-xl border border-white/10 p-3">{visible.map(item => <button key={item.code} onClick={() => setSelectedCode(item.code)} className={`mb-1 w-full rounded-lg p-2 text-left text-xs ${selected?.code === item.code ? 'bg-glow/20 text-glow' : 'hover:bg-white/5'}`}><span className="font-bold">{item.code}</span><span className="float-right">{2-item.blockers.length}/2</span></button>)}</aside>
            {selected && <section className="space-y-6 rounded-xl border border-white/10 p-5">
                <div><h2 className="text-xl font-bold">{selected.code}</h2><p className="break-all font-mono text-[10px] text-cream/40">Content hash: {selected.contentVersion}</p>{selected.blockers.map(blocker => <p key={blocker} className="text-sm text-amber-300">{blocker}</p>)}</div>
                <div><h3 className="font-bold">Canonical realization</h3><p>{selected.realization.core.join(' · ')}</p><p className="text-sm text-cream/60">Accepted variants: {selected.realization.acceptedMeaningVariants.join(' · ')}</p></div>
                <div className="grid gap-3 md:grid-cols-3">{selected.contexts.map(context => <article key={context.slug} className="rounded-xl bg-white/5 p-4 text-sm"><h3 className="font-bold">{context.setting}</h3><p className="text-cream/60">Partner: {context.partner}</p><p className="mt-2">“{context.opening}”</p><p className="mt-2">Goal: {context.learnerGoal}</p><p className="mt-2 text-cream/60">Variation: {context.variation}</p></article>)}</div>
                <details className="rounded-xl bg-white/5 p-4"><summary className="font-bold">Learning coverage and listening</summary><div className="mt-3 space-y-2 text-sm"><p><b>Spoken:</b> {selected.production.spoken}</p><p><b>Written:</b> {selected.production.written}</p><p><b>Interaction:</b> {selected.interaction}</p><p><b>Repair:</b> {selected.repair.trigger} {selected.repair.strategy}</p><p><b>Transfer:</b> {selected.transfer.novelty}</p><p><b>Retention after {selected.retention.delayHours}h:</b> {selected.retention.prompt}</p>{selected.listening.map(line => <p key={`${line.speaker}-${line.line}`}><b>{line.speaker} ({line.locale}, {line.rate}×):</b> {line.line}</p>)}</div></details>
                <p className="rounded-xl bg-white/5 p-4 text-sm"><b>Cultural note:</b> {selected.cultureNote}</p>
                <div className="grid gap-5 md:grid-cols-2">{(['cultural','native_speaker'] as const).map(kind => { const current = selected.reviews[kind]; const form = forms[kind]; return <article key={kind} className="space-y-3 rounded-xl border border-white/10 p-4"><h3 className="font-bold">{kind === 'cultural' ? 'Cultural review' : 'Native-speaker review'}</h3>{current ? <div className="text-sm"><p className={current.decision === 'approved' ? 'text-leaf' : 'text-red-300'}>{current.decision} by {current.reviewerId}</p><p className="text-cream/60">{current.reviewerQualification}</p><p>{current.note}</p></div> : <p className="text-sm text-cream/50">No decision yet.</p>}<input className="w-full rounded-lg bg-white/10 p-2 text-sm" placeholder="Your relevant qualification (10+ characters)" value={form.qualification} onChange={event => setForms(old => ({ ...old, [kind]: { ...old[kind], qualification: event.target.value } }))} /><textarea className="h-28 w-full rounded-lg bg-white/10 p-2 text-sm" placeholder="Review findings and rationale (20+ characters)" value={form.note} onChange={event => setForms(old => ({ ...old, [kind]: { ...old[kind], note: event.target.value } }))} /><div className="flex gap-2"><button className={button} disabled={busy || form.qualification.trim().length < 10 || form.note.trim().length < 20} onClick={() => decide(kind,'approved')}>Approve</button><button className={button} disabled={busy || form.qualification.trim().length < 10 || form.note.trim().length < 20} onClick={() => decide(kind,'rejected')}>Reject</button></div></article> })}</div>
                <details><summary>Decision history ({selected.history.length})</summary>{selected.history.map(row => <p key={row.id} className="mt-2 text-xs">{new Date(row.createdAt).toLocaleString()} · {row.kind} · {row.decision} · {row.reviewerId} · {row.note}</p>)}</details>
            </section>}
        </div>
    </div></main>
}
