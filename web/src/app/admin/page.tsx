'use client'

/**
 * /admin — Course builder (premium pass).
 * Create concepts, structure the 4-part journey, AI-generate flavor text and exercises.
 * No loading screen — creation form renders immediately with defaults.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    ArrowLeft, Save, Loader2, Plus, Trash2, BookOpen, Ear,
    AlertTriangle, MessageCircle, Sparkles, Lightbulb, Wand2
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type SubLesson = {
    title: string
    icon: 'book-open' | 'ear' | 'alert-triangle' | 'message-circle'
    xpReward: number
    teach: any[]
    exercises: any[]
    realLife: { prompt: string; chatSeed: string }
}

const INITIAL_SUBS: SubLesson[] = [
    { title: 'Understand', icon: 'book-open', xpReward: 5, teach: [], exercises: [], realLife: { prompt: '', chatSeed: '' } },
    { title: 'Hear it', icon: 'ear', xpReward: 5, teach: [], exercises: [], realLife: { prompt: '', chatSeed: '' } },
    { title: 'Watch out', icon: 'alert-triangle', xpReward: 5, teach: [], exercises: [], realLife: { prompt: '', chatSeed: '' } },
    { title: 'Use it', icon: 'message-circle', xpReward: 5, teach: [], exercises: [], realLife: { prompt: '', chatSeed: '' } },
]

export default function AdminPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState<string | null>(null)
    const [activeSub, setActiveSub] = useState(0)
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [rawExercises, setRawExercises] = useState<Record<number, string>>({})

    const [concept, setConcept] = useState<any>({
        unitId: 'unit-1-identity',
        name: '',
        cefrLevel: 'A1',
        grammarNote: '',
        vocabItems: [{ word: '', translation: '' }],
        orderIndex: 5,
        xpReward: 20,
        variants: [
            { mode: 'STORY', storyBeat: null, culturalRef: null, formalPhrase: null },
            { mode: 'DRILL', storyBeat: null, culturalRef: null, formalPhrase: null },
            { mode: 'IMMERSION', storyBeat: null, culturalRef: null, formalPhrase: null },
            { mode: 'PROFESSIONAL', storyBeat: null, culturalRef: null, formalPhrase: null },
        ],
        subLessons: JSON.parse(JSON.stringify(INITIAL_SUBS)),
    })

    const updateConcept = (field: string, value: any) => setConcept((prev: any) => ({ ...prev, [field]: value }))
    const addVocab = () => updateConcept('vocabItems', [...concept.vocabItems, { word: '', translation: '' }])
    const removeVocab = (i: number) => updateConcept('vocabItems', concept.vocabItems.filter((_: any, j: number) => j !== i))
    const updateVocab = (i: number, field: 'word' | 'translation', value: string) => {
        const items = [...concept.vocabItems]
        items[i] = { ...items[i], [field]: value }
        updateConcept('vocabItems', items)
    }

    const updateVariant = (mode: string, field: string, value: string) => {
        setConcept((prev: any) => ({
            ...prev,
            variants: prev.variants.map((v: any) => v.mode === mode ? { ...v, [field]: value || null } : v),
        }))
    }

    const updateSub = (field: keyof SubLesson, value: any) => {
        setConcept((prev: any) => {
            const subs = [...prev.subLessons]
            subs[activeSub] = { ...subs[activeSub], [field]: value }
            return { ...prev, subLessons: subs }
        })
    }

    const addTeachBlock = (type: string) => {
        const block = type === 'vocab'
            ? { type, items: [{ word: '', translation: '' }] }
            : type === 'example'
                ? { type, es: '', en: '' }
                : { type, text: '' }
        updateSub('teach', [...concept.subLessons[activeSub].teach, block])
    }

    const updateTeachBlock = (i: number, field: string, value: any) => {
        const teach = [...concept.subLessons[activeSub].teach]
        teach[i] = { ...teach[i], [field]: value }
        updateSub('teach', teach)
    }

    const removeTeachBlock = (i: number) => {
        updateSub('teach', concept.subLessons[activeSub].teach.filter((_: any, j: number) => j !== i))
    }

    const handleExercisesChange = (text: string) => {
        setRawExercises(prev => ({ ...prev, [activeSub]: text }))
        try {
            const parsed = text.trim() ? JSON.parse(text) : []
            if (!Array.isArray(parsed)) throw new Error('Must be an array')
            setJsonError(null)
            updateSub('exercises', parsed)
        } catch (e: any) {
            setJsonError(e.message)
        }
    }

    const handleGenerateFlavor = async (mode: 'STORY' | 'IMMERSION' | 'PROFESSIONAL') => {
        setGenerating(`flavor-${mode}`)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/generate-flavor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ mode, conceptName: concept.name, grammarNote: concept.grammarNote, vocabItems: concept.vocabItems }),
            })
            const data = await res.json()
            if (!data.text) return
            const field = mode === 'STORY' ? 'storyBeat' : mode === 'IMMERSION' ? 'culturalRef' : 'formalPhrase'
            updateVariant(mode, field, data.text)
        } catch (e) { console.error(e) } finally { setGenerating(null) }
    }

    const handleGenerateExercises = async () => {
        setGenerating(`ex-${activeSub}`)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/generate-exercises`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    mode: 'DRILL',
                    conceptName: `${concept.name} — ${concept.subLessons[activeSub].title}`,
                    grammarNote: concept.grammarNote,
                    vocabItems: concept.vocabItems,
                }),
            })
            const data = await res.json()
            if (Array.isArray(data.exercises) && data.exercises.length) {
                updateSub('exercises', data.exercises)
                setRawExercises(prev => ({ ...prev, [activeSub]: JSON.stringify(data.exercises, null, 2) }))
                setJsonError(null)
            }
        } catch (e) { console.error(e) } finally { setGenerating(null) }
    }

    const handleSave = async () => {
        if (!concept.name.trim()) return alert('Concept name is required')
        if (jsonError) return alert('Fix the exercises JSON before saving')
        setSaving(true)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/concepts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(concept),
            })
            if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
            alert('Concept + 4 sub-lessons published!')
            setConcept((prev: any) => ({
                ...prev,
                name: '', grammarNote: '',
                orderIndex: prev.orderIndex + 1,
                subLessons: JSON.parse(JSON.stringify(INITIAL_SUBS)),
            }))
            setRawExercises({})
        } catch (e: any) {
            alert(e.message)
        } finally { setSaving(false) }
    }

    const currentSub = concept.subLessons[activeSub]
    const SubIcons: Record<string, any> = { 'book-open': BookOpen, 'ear': Ear, 'alert-triangle': AlertTriangle, 'message-circle': MessageCircle }

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-cream/60 hover:text-cream text-sm font-semibold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-glow hover:bg-glow/90 disabled:opacity-50 rounded-xl font-bold text-night-900 flex items-center gap-2 transition-all active:scale-[0.98]">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Publish Concept
                    </button>
                </div>

                <h1 className="font-display text-3xl font-bold mb-2">Course Builder</h1>
                <p className="text-cream/50 mb-8">Create concepts, structure the 4-part journey, and let AI draft the flavor text and exercises.</p>

                <section className="rounded-2xl border border-white/10 bg-[#13131B] p-6 mb-6">
                    <h2 className="font-display text-xl font-bold mb-4">1. Concept Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <input value={concept.name} onChange={e => updateConcept('name', e.target.value)} placeholder="Concept Name" className="md:col-span-2 p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none transition-colors" />
                        <select value={concept.cefrLevel} onChange={e => updateConcept('cefrLevel', e.target.value)} className="p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none transition-colors">
                            {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => <option key={l} value={l} className="bg-[#0B0B10]">{l}</option>)}
                        </select>
                        <input type="number" value={concept.orderIndex} onChange={e => updateConcept('orderIndex', +e.target.value)} placeholder="Order" className="p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none transition-colors" />
                    </div>
                    <textarea value={concept.grammarNote} onChange={e => updateConcept('grammarNote', e.target.value)} placeholder="Grammar Note / Core Rule" className="w-full p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none min-h-[80px] mb-4 transition-colors" />
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-cream/40 mb-2 block">Vocabulary</label>
                    <div className="space-y-2 mb-2">
                        {concept.vocabItems.map((v: any, i: number) => (
                            <div key={i} className="flex gap-2">
                                <input value={v.word} onChange={e => updateVocab(i, 'word', e.target.value)} placeholder="Word" className="flex-1 p-2 bg-[#0B0B10] border border-white/10 rounded focus:border-glow outline-none text-sm transition-colors" />
                                <input value={v.translation} onChange={e => updateVocab(i, 'translation', e.target.value)} placeholder="Translation" className="flex-1 p-2 bg-[#0B0B10] border border-white/10 rounded focus:border-glow outline-none text-sm transition-colors" />
                                <button onClick={() => removeVocab(i)} className="p-2 text-coral/60 hover:text-coral transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addVocab} className="text-xs text-glow flex items-center gap-1 hover:text-glow/90 transition-colors"><Plus className="w-3 h-3" /> Add word</button>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#13131B] p-6 mb-6">
                    <h2 className="font-display text-xl font-bold mb-4">2. Mode Flavor Text</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {concept.variants.map((v: any) => (
                            <div key={v.mode} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-semibold uppercase tracking-widest text-cream/40">{v.mode} Mode</label>
                                    {v.mode !== 'DRILL' && (
                                        <button
                                            onClick={() => handleGenerateFlavor(v.mode)}
                                            disabled={generating === `flavor-${v.mode}`}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            {generating === `flavor-${v.mode}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Wand2 className="w-4 h-4" />
                                            )}
                                            <span>{generating === `flavor-${v.mode}` ? 'Generating...' : 'Generate with AI'}</span>
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={v.storyBeat || v.culturalRef || v.formalPhrase || ''}
                                    onChange={e => {
                                        const field = v.mode === 'STORY' ? 'storyBeat' : v.mode === 'IMMERSION' ? 'culturalRef' : 'formalPhrase'
                                        if (v.mode !== 'DRILL') updateVariant(v.mode, field, e.target.value)
                                    }}
                                    placeholder={v.mode === 'DRILL' ? 'No flavor text for Drill mode.' : `Enter ${v.mode.toLowerCase()} context or generate with AI...`}
                                    disabled={v.mode === 'DRILL'}
                                    className="w-full p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none min-h-[70px] text-sm disabled:opacity-50 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#13131B] p-6">
                    <h2 className="font-display text-xl font-bold mb-4">3. The 4-Part Journey</h2>
                    <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
                        {concept.subLessons.map((sub: SubLesson, i: number) => {
                            const Icon = SubIcons[sub.icon]
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActiveSub(i)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-all ${i === activeSub ? 'border-glow text-glow' : 'border-transparent text-cream/50 hover:text-cream'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-semibold text-sm">{sub.title}</span>
                                </button>
                            )
                        })}
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input value={currentSub.title} onChange={e => updateSub('title', e.target.value)} placeholder="Part Title" className="md:col-span-2 p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none font-bold transition-colors" />
                            <input type="number" value={currentSub.xpReward} onChange={e => updateSub('xpReward', +e.target.value)} placeholder="XP" className="p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none transition-colors" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-cream/80">Teach Blocks</h3>
                                <div className="flex gap-2">
                                    {['explain', 'example', 'vocab', 'tip'].map(t => (
                                        <button key={t} onClick={() => addTeachBlock(t)} className="text-xs px-3 py-1.5 bg-[#0B0B10] hover:bg-white/5 rounded-lg border border-white/10 transition-colors active:scale-[0.98]">+ {t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {currentSub.teach.map((block: any, i: number) => (
                                    <div key={i} className="p-4 border border-white/10 bg-[#0B0B10] rounded-lg relative">
                                        <button onClick={() => removeTeachBlock(i)} className="absolute top-2 right-2 text-coral/60 hover:text-coral transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        <span className="text-[10px] uppercase font-bold text-cream/40 mb-2 block">{block.type}</span>
                                        {block.type === 'explain' && (
                                            <textarea value={block.text} onChange={e => updateTeachBlock(i, 'text', e.target.value)} placeholder="Explanation..." className="w-full p-2 bg-[#13131B] border border-white/5 rounded text-sm min-h-[60px] transition-colors" />
                                        )}
                                        {block.type === 'example' && (
                                            <div className="space-y-2">
                                                <input value={block.es} onChange={e => updateTeachBlock(i, 'es', e.target.value)} placeholder="Spanish example" className="w-full p-2 bg-[#13131B] border border-white/5 rounded text-sm font-bold transition-colors" />
                                                <input value={block.en} onChange={e => updateTeachBlock(i, 'en', e.target.value)} placeholder="English translation" className="w-full p-2 bg-[#13131B] border border-white/5 rounded text-sm text-cream/60 italic transition-colors" />
                                            </div>
                                        )}
                                        {block.type === 'tip' && (
                                            <div className="flex gap-2 items-start">
                                                <Lightbulb className="w-4 h-4 text-glow mt-2 flex-shrink-0" />
                                                <textarea value={block.text} onChange={e => updateTeachBlock(i, 'text', e.target.value)} placeholder="Pro-tip..." className="w-full p-2 bg-[#13131B] border border-white/5 rounded text-sm min-h-[60px] transition-colors" />
                                            </div>
                                        )}
                                        {block.type === 'vocab' && (
                                            <div className="space-y-2">
                                                {block.items.map((item: any, j: number) => (
                                                    <div key={j} className="flex gap-2">
                                                        <input value={item.word} onChange={e => {
                                                            const items = [...block.items]; items[j] = { ...items[j], word: e.target.value }
                                                            updateTeachBlock(i, 'items', items)
                                                        }} placeholder="Word" className="flex-1 p-2 bg-[#13131B] border border-white/5 rounded text-sm transition-colors" />
                                                        <input value={item.translation} onChange={e => {
                                                            const items = [...block.items]; items[j] = { ...items[j], translation: e.target.value }
                                                            updateTeachBlock(i, 'items', items)
                                                        }} placeholder="Translation" className="flex-1 p-2 bg-[#13131B] border border-white/5 rounded text-sm transition-colors" />
                                                    </div>
                                                ))}
                                                <button onClick={() => updateTeachBlock(i, 'items', [...block.items, { word: '', translation: '' }])} className="text-xs text-glow flex items-center gap-1 hover:text-glow/90 transition-colors"><Plus className="w-3 h-3" /> Add word</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {currentSub.teach.length === 0 && <p className="text-center text-cream/30 text-sm py-4 border border-dashed border-white/10 rounded-lg">No teach blocks yet.</p>}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-cream/80">Exercises (JSON)</h3>
                                <button
                                    onClick={handleGenerateExercises}
                                    disabled={generating === `ex-${activeSub}`}
                                    className="px-5 py-2.5 bg-leaf hover:bg-leaf/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    {generating === `ex-${activeSub}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>{generating === `ex-${activeSub}` ? 'Generating Exercises...' : 'AI Generate 3 Exercises'}</span>
                                </button>
                            </div>
                            <textarea
                                value={rawExercises[activeSub] !== undefined ? rawExercises[activeSub] : JSON.stringify(currentSub.exercises, null, 2)}
                                onChange={e => handleExercisesChange(e.target.value)}
                                placeholder='[{"type": "mcq", "prompt": "...", "options": [], "answer": "..."}]'
                                className={`w-full p-3 bg-[#0B0B10] border rounded-lg focus:outline-none font-mono text-xs min-h-[150px] transition-colors ${jsonError ? 'border-coral' : 'border-white/10 focus:border-glow'}`}
                            />
                            {jsonError && <p className="text-coral text-xs mt-1">Invalid JSON: {jsonError}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-cream/40 mb-1 block">Real-Life Prompt</label>
                                <textarea value={currentSub.realLife.prompt} onChange={e => updateSub('realLife', { ...currentSub.realLife, prompt: e.target.value })} placeholder="Say out loud..." className="w-full p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none text-sm min-h-[80px] transition-colors" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-cream/40 mb-1 block">Ecla Chat Seed</label>
                                <textarea value={currentSub.realLife.chatSeed} onChange={e => updateSub('realLife', { ...currentSub.realLife, chatSeed: e.target.value })} placeholder="Quiero practicar..." className="w-full p-3 bg-[#0B0B10] border border-white/10 rounded-lg focus:border-glow outline-none text-sm min-h-[80px] transition-colors" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppShell>
    )
}