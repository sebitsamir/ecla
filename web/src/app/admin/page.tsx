'use client'

/**
 * /admin — Competency authoring (Phase 19).
 * Browse course tree, edit competency metadata, validate content.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type CompRef = { id: string; code: string; title: string; canDo: string; domain: string }
type UnitRef = { id: string; title: string; competencies: CompRef[] }

export default function AdminPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [units, setUnits] = useState<UnitRef[]>([])
    const [selected, setSelected] = useState<CompRef | null>(null)
    const [detail, setDetail] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [validating, setValidating] = useState(false)
    const [validation, setValidation] = useState<{ passed: boolean; errors: string[]; warnings: string[] } | null>(null)

    const [form, setForm] = useState({ title: '', canDo: '', grammarNote: '', pronunciationNote: '', culturalNote: '' })

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/admin/course-tree`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                setUnits(data.courses?.[0]?.units ?? [])
            } catch { /* admin only */ } finally { setLoading(false) }
        })()
    }, [getToken])

    const loadCompetency = async (comp: CompRef) => {
        setSelected(comp)
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/v1/admin/competencies/${comp.code}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setDetail(data.competency)
        const r = data.competency?.realizations?.[0]
        setForm({
            title: data.competency?.title ?? '',
            canDo: data.competency?.canDo ?? '',
            grammarNote: r?.grammarNote ?? '',
            pronunciationNote: r?.pronunciationNote ?? '',
            culturalNote: r?.culturalNote ?? '',
        })
    }

    const save = async () => {
        if (!selected) return
        setSaving(true)
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/admin/competencies/${selected.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            })
        } finally { setSaving(false) }
    }

    const validateContent = async () => {
        setValidating(true)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/validate-content`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            setValidation(await res.json())
        } finally { setValidating(false) }
    }

    return (
        <AppShell>
            <div className="mx-auto max-w-5xl space-y-6">
                <header className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard')} className="text-cream/60 hover:text-cream">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-cream">Content authoring</h1>
                        <p className="text-sm text-cream/50">Competency metadata · validation gate · seed phases for depth</p>
                    </div>
                </header>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={validateContent}
                        disabled={validating}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-cream hover:bg-white/10"
                    >
                        {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Validate content
                    </button>
                </div>

                {validation && (
                    <div className={`rounded-2xl border p-4 ${validation.passed ? 'border-leaf/30 bg-leaf/5' : 'border-red-500/30 bg-red-500/5'}`}>
                        <p className="text-sm font-semibold text-cream mb-2">
                            {validation.passed ? 'Validation passed' : 'Validation failed'}
                        </p>
                        {validation.errors.map(e => (
                            <p key={e} className="text-xs text-red-300 flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5" />{e}</p>
                        ))}
                        {validation.warnings.map(w => (
                            <p key={w} className="text-xs text-cream/50">{w}</p>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                        <aside className="rounded-2xl border border-white/10 bg-[#13131B] p-4 max-h-[70vh] overflow-y-auto">
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-3">Curriculum</p>
                            {units.map(u => (
                                <div key={u.id} className="mb-4">
                                    <p className="text-xs font-semibold text-glow mb-1">{u.title}</p>
                                    <ul className="space-y-1">
                                        {u.competencies.map(c => (
                                            <li key={c.id}>
                                                <button
                                                    onClick={() => loadCompetency(c)}
                                                    className={`w-full text-left rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                                        selected?.code === c.code ? 'bg-glow/20 text-glow' : 'text-cream/70 hover:bg-white/5'
                                                    }`}
                                                >
                                                    {c.code}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </aside>

                        <section className="rounded-2xl border border-white/10 bg-[#13131B] p-6">
                            {!selected ? (
                                <p className="text-sm text-cream/50">Select a competency to edit metadata.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-cream/40">{selected.code}</p>
                                        <p className="text-xs text-cream/50">{detail?.experiences?.length ?? 0} experiences · {detail?.missions?.length ?? 0} missions</p>
                                    </div>
                                    {(['title', 'canDo', 'grammarNote', 'pronunciationNote', 'culturalNote'] as const).map(field => (
                                        <div key={field}>
                                            <label className="text-xs text-cream/50 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                                            <textarea
                                                value={form[field]}
                                                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                                rows={field === 'canDo' ? 2 : 1}
                                                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-sm text-cream"
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={save}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-xl bg-glow px-5 py-2.5 text-sm font-bold text-night-900"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
