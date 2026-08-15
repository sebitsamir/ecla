'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2, Save, Sparkles, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import NightBackground from '@/components/NightBackground'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Variant = {
    mode: 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL'
    storyBeat: string | null
    culturalRef: string | null
    formalPhrase: string | null
    exercises: any[]
}

type Concept = {
    id?: string
    unitId: string
    name: string
    cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
    grammarNote: string
    vocabItems: { word: string; translation: string }[]
    orderIndex: number
    xpReward: number
    variants: Variant[]
}

const initialConcept: Concept = {
    unitId: 'unit-1-identity',
    name: '',
    cefrLevel: 'A1',
    grammarNote: '',
    vocabItems: [{ word: '', translation: '' }],
    orderIndex: 4,
    xpReward: 20,
    variants: [
        { mode: 'STORY', storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [] },
        { mode: 'DRILL', storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [] },
        { mode: 'IMMERSION', storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [] },
        { mode: 'PROFESSIONAL', storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [] },
    ],
}

export default function AdminPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [concept, setConcept] = useState<Concept>(initialConcept)
    const [rawExercises, setRawExercises] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState<string | null>(null)

    const handleSave = async () => {
        if (!concept.name.trim() || !concept.grammarNote.trim()) {
            alert('Please fill out the Concept Name and Grammar Note.')
            return
        }

        setSaving(true)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/concepts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(concept),
            })

            if (!res.ok) {
                const errorData = await res.json()
                console.error('API Rejected Save:', errorData)
                if (errorData.details) {
                    console.error('Zod Validation Errors:', JSON.stringify(errorData.details, null, 2))
                }
                throw new Error(errorData.error || 'Save failed')
            }

            alert('Concept saved successfully!')
            setConcept({ ...initialConcept, orderIndex: concept.orderIndex + 1 })
        } catch (e) {
            console.error(e)
            alert(e instanceof Error ? e.message : 'Failed to save concept.')
        } finally {
            setSaving(false)
        }
    }

    const handleGenerate = async (mode: 'STORY' | 'IMMERSION' | 'PROFESSIONAL') => {
        setGenerating(mode)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/generate-flavor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    mode,
                    conceptName: concept.name,
                    grammarNote: concept.grammarNote,
                    vocabItems: concept.vocabItems,
                }),
            })
            const data = await res.json()

            setConcept(prev => ({
                ...prev,
                variants: prev.variants.map(v => {
                    if (v.mode === mode) {
                        if (mode === 'STORY') return { ...v, storyBeat: data.text }
                        if (mode === 'IMMERSION') return { ...v, culturalRef: data.text }
                        if (mode === 'PROFESSIONAL') return { ...v, formalPhrase: data.text }
                    }
                    return v
                }),
            }))
        } catch (e) {
            console.error(e)
        } finally {
            setGenerating(null)
        }
    }

    const handleGenerateExercises = async (mode: string, idx: number) => {
        setGenerating(`EX-${mode}`)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/admin/generate-exercises`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    mode,
                    conceptName: concept.name,
                    grammarNote: concept.grammarNote,
                    vocabItems: concept.vocabItems,
                }),
            })
            const data = await res.json()

            setRawExercises(prev => ({ ...prev, [mode]: JSON.stringify(data.exercises, null, 2) }))

            const newVariants = [...concept.variants]
            newVariants[idx].exercises = data.exercises
            setConcept(prev => ({ ...prev, variants: newVariants }))
        } catch (e) {
            console.error(e)
        } finally {
            setGenerating(null)
        }
    }

    const handleExerciseTextChange = (mode: string, idx: number, text: string) => {
        setRawExercises(prev => ({ ...prev, [mode]: text }))
        try {
            const parsed = JSON.parse(text)
            if (Array.isArray(parsed)) {
                const newVariants = [...concept.variants]
                newVariants[idx].exercises = parsed
                setConcept(prev => ({ ...prev, variants: newVariants }))
            }
        } catch (err) {
            // Ignore invalid JSON while typing
        }
    }

    const addVocab = () => setConcept(prev => ({ ...prev, vocabItems: [...prev.vocabItems, { word: '', translation: '' }] }))
    const removeVocab = (index: number) => setConcept(prev => ({ ...prev, vocabItems: prev.vocabItems.filter((_, i) => i !== index) }))
    const updateVocab = (index: number, field: 'word' | 'translation', value: string) => {
        const newVocab = [...concept.vocabItems]
        newVocab[index] = { ...newVocab[index], [field]: value }
        setConcept(prev => ({ ...prev, vocabItems: newVocab }))
    }

    const updateExercises = (idx: number, value: string) => {
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
                const newVariants = [...concept.variants]
                newVariants[idx].exercises = parsed
                setConcept(prev => ({ ...prev, variants: newVariants }))
            }
        } catch (err) {
            // Ignore invalid JSON while typing
        }
    }

    return (
        <main className="min-h-screen font-body text-cream">
            <NightBackground />
            
            <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8">
                <button 
                    onClick={() => router.push('/dashboard')} 
                    className="flex items-center gap-2 text-cream/60 hover:text-cream mb-8 transition-colors text-sm font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <h1 className="font-display text-3xl font-bold mb-2">Admin CMS</h1>
                <p className="text-cream/50 mb-8">Create and manage Concepts & Lesson Variants.</p>

                {/* Concept Basics */}
                <div className="rounded-card border border-white/5 bg-night-800/60 backdrop-blur-sm p-6 mb-6 shadow-glow-sm">
                    <h2 className="font-display text-xl font-bold mb-4">Concept Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            value={concept.name}
                            onChange={e => setConcept(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Concept Name (e.g., Present Tense -ER/-IR)"
                            className="p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 transition-colors"
                        />
                        <select
                            value={concept.cefrLevel}
                            onChange={e => setConcept(prev => ({ ...prev, cefrLevel: e.target.value as any }))}
                            className="p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream transition-colors"
                        >
                            <option value="A1" className="bg-night-900">A1</option>
                            <option value="A2" className="bg-night-900">A2</option>
                            <option value="B1" className="bg-night-900">B1</option>
                            <option value="B2" className="bg-night-900">B2</option>
                            <option value="C1" className="bg-night-900">C1</option>
                        </select>
                    </div>
                    <textarea
                        value={concept.grammarNote}
                        onChange={e => setConcept(prev => ({ ...prev, grammarNote: e.target.value }))}
                        placeholder="Grammar Note / Rule"
                        className="w-full p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 mb-4 min-h-[100px] transition-colors"
                    />

                    <div className="space-y-2 mb-4">
                        <h3 className="font-semibold text-cream/70">Vocabulary Items</h3>
                        {concept.vocabItems.map((v, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    value={v.word}
                                    onChange={e => updateVocab(i, 'word', e.target.value)}
                                    placeholder="Word"
                                    className="flex-1 p-2 bg-night-900/60 border border-white/10 rounded focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 transition-colors"
                                />
                                <input
                                    value={v.translation}
                                    onChange={e => updateVocab(i, 'translation', e.target.value)}
                                    placeholder="Translation"
                                    className="flex-1 p-2 bg-night-900/60 border border-white/10 rounded focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 transition-colors"
                                />
                                <button 
                                    onClick={() => removeVocab(i)} 
                                    className="p-2 text-coral hover:bg-coral/10 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={addVocab} 
                            className="text-sm text-glow hover:text-glow-bright flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Vocab
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            value={concept.orderIndex}
                            onChange={e => setConcept(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                            placeholder="Order Index (e.g., 4)"
                            className="p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 transition-colors"
                        />
                        <input
                            type="number"
                            value={concept.xpReward}
                            onChange={e => setConcept(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 20 }))}
                            placeholder="XP Reward"
                            className="p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 transition-colors"
                        />
                    </div>
                </div>

                {/* Mode Variants */}
                <div className="space-y-6">
                    {concept.variants.map((variant, idx) => (
                        <div key={variant.mode} className="rounded-card border border-white/5 bg-night-800/60 backdrop-blur-sm p-6 shadow-glow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-display text-xl font-bold">{variant.mode} Mode Variant</h2>
                                {variant.mode !== 'DRILL' && (
                                    <button
                                        onClick={() => handleGenerate(variant.mode as 'STORY' | 'IMMERSION' | 'PROFESSIONAL')}
                                        disabled={generating === variant.mode}
                                        className="px-3 py-1.5 bg-immersion hover:bg-immersion/90 disabled:bg-night-900/40 disabled:text-cream/30 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                                    >
                                        {generating === variant.mode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Generate with AI
                                    </button>
                                )}
                            </div>

                            {variant.mode === 'STORY' && (
                                <textarea
                                    value={variant.storyBeat || ''}
                                    onChange={e => {
                                        const newVariants = [...concept.variants]
                                        newVariants[idx].storyBeat = e.target.value || null
                                        setConcept(prev => ({ ...prev, variants: newVariants }))
                                    }}
                                    placeholder="Story Beat (e.g., Mateo arrives in Madrid...)"
                                    className="w-full p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 min-h-[80px] transition-colors"
                                />
                            )}
                            {variant.mode === 'IMMERSION' && (
                                <textarea
                                    value={variant.culturalRef || ''}
                                    onChange={e => {
                                        const newVariants = [...concept.variants]
                                        newVariants[idx].culturalRef = e.target.value || null
                                        setConcept(prev => ({ ...prev, variants: newVariants }))
                                    }}
                                    placeholder="Cultural Reference (e.g., In Spain, people...)"
                                    className="w-full p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 min-h-[80px] transition-colors"
                                />
                            )}
                            {variant.mode === 'PROFESSIONAL' && (
                                <textarea
                                    value={variant.formalPhrase || ''}
                                    onChange={e => {
                                        const newVariants = [...concept.variants]
                                        newVariants[idx].formalPhrase = e.target.value || null
                                        setConcept(prev => ({ ...prev, variants: newVariants }))
                                    }}
                                    placeholder="Formal Phrase (e.g., In a meeting, you might say...)"
                                    className="w-full p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 min-h-[80px] transition-colors"
                                />
                            )}
                            {variant.mode === 'DRILL' && (
                                <p className="text-cream/40 text-sm italic mb-4">Drill mode uses the concept data directly. No extra flavor text needed.</p>
                            )}

                            {/* EXERCISES JSON TEXTAREA */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs text-cream/40 uppercase tracking-wider block font-semibold">
                                        Exercises (JSON)
                                    </label>
                                    <button
                                        onClick={() => handleGenerateExercises(variant.mode, idx)}
                                        disabled={generating === `EX-${variant.mode}`}
                                        className="px-2 py-1 bg-leaf hover:bg-leaf/90 disabled:bg-night-900/40 disabled:text-cream/30 rounded text-xs font-semibold flex items-center gap-1 transition-all"
                                    >
                                        {generating === `EX-${variant.mode}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        AI Generate
                                    </button>
                                </div>
                                <textarea
                                    value={rawExercises[variant.mode] || JSON.stringify(variant.exercises, null, 2)}
                                    onChange={e => handleExerciseTextChange(variant.mode, idx, e.target.value)}
                                    placeholder='[{"type": "mcq", ...}]'
                                    className="w-full p-3 bg-night-900/60 border border-white/10 rounded-lg focus:outline-none focus:border-glow text-cream placeholder:text-cream/30 min-h-[150px] font-mono text-sm transition-colors"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-6 mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-glow hover:bg-glow-bright disabled:bg-night-900/40 disabled:text-cream/30 rounded-xl font-bold text-night-900 transition-all flex items-center gap-2 shadow-glow-md"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Publishing...' : 'Publish Concept'}
                    </button>
                </div>
            </div>
        </main>
    )
}