'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2, Save, Sparkles, ArrowLeft, Plus, Trash2 } from 'lucide-react'

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
    orderIndex: 4, // Default to 4 for the next concept!
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
            // Reset form for next concept
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

            // Update the raw text area
            setRawExercises(prev => ({ ...prev, [mode]: JSON.stringify(data.exercises, null, 2) }))

            // Update the actual concept state
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
        <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-2">Admin CMS</h1>
                <p className="text-zinc-400 mb-8">Create and manage Concepts & Lesson Variants.</p>

                {/* Concept Basics */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Concept Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            value={concept.name}
                            onChange={e => setConcept(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Concept Name (e.g., Present Tense -ER/-IR)"
                            className="p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                        <select
                            value={concept.cefrLevel}
                            onChange={e => setConcept(prev => ({ ...prev, cefrLevel: e.target.value as any }))}
                            className="p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                            <option value="A1">A1</option><option value="A2">A2</option>
                            <option value="B1">B1</option><option value="B2">B2</option>
                            <option value="C1">C1</option>
                        </select>
                    </div>
                    <textarea
                        value={concept.grammarNote}
                        onChange={e => setConcept(prev => ({ ...prev, grammarNote: e.target.value }))}
                        placeholder="Grammar Note / Rule"
                        className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 mb-4 min-h-[100px]"
                    />

                    <div className="space-y-2 mb-4">
                        <h3 className="font-medium text-zinc-300">Vocabulary Items</h3>
                        {concept.vocabItems.map((v, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    value={v.word}
                                    onChange={e => updateVocab(i, 'word', e.target.value)}
                                    placeholder="Word"
                                    className="flex-1 p-2 bg-zinc-950 border border-zinc-700 rounded focus:outline-none focus:border-emerald-500"
                                />
                                <input
                                    value={v.translation}
                                    onChange={e => updateVocab(i, 'translation', e.target.value)}
                                    placeholder="Translation"
                                    className="flex-1 p-2 bg-zinc-950 border border-zinc-700 rounded focus:outline-none focus:border-emerald-500"
                                />
                                <button onClick={() => removeVocab(i)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button onClick={addVocab} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Vocab</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            value={concept.orderIndex}
                            onChange={e => setConcept(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                            placeholder="Order Index (e.g., 4)"
                            className="p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                        <input
                            type="number"
                            value={concept.xpReward}
                            onChange={e => setConcept(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 20 }))}
                            placeholder="XP Reward"
                            className="p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                {/* Mode Variants */}
                <div className="space-y-6">
                    {concept.variants.map((variant, idx) => (
                        <div key={variant.mode} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">{variant.mode} Mode Variant</h2>
                                {variant.mode !== 'DRILL' && (
                                    <button
                                        onClick={() => handleGenerate(variant.mode as 'STORY' | 'IMMERSION' | 'PROFESSIONAL')} // <-- ADD THE CAST HERE
                                        disabled={generating === variant.mode}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
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
                                    className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[80px]"
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
                                    className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[80px]"
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
                                    className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[80px]"
                                />
                            )}
                            {variant.mode === 'DRILL' && (
                                <p className="text-zinc-500 text-sm italic mb-4">Drill mode uses the concept data directly. No extra flavor text needed.</p>
                            )}

                            {/* EXERCISES JSON TEXTAREA */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs text-zinc-400 uppercase tracking-wider block">
                                        Exercises (JSON)
                                    </label>
                                    <button
                                        onClick={() => handleGenerateExercises(variant.mode, idx)}
                                        disabled={generating === `EX-${variant.mode}`}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        {generating === `EX-${variant.mode}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        AI Generate
                                    </button>
                                </div>
                                <textarea
                                    value={rawExercises[variant.mode] || JSON.stringify(variant.exercises, null, 2)}
                                    onChange={e => handleExerciseTextChange(variant.mode, idx, e.target.value)}
                                    placeholder='[{"type": "mcq", ...}]'
                                    className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[150px] font-mono text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-6 mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Publishing...' : 'Publish Concept'}
                    </button>
                </div>
            </div>
        </main>
    )
}