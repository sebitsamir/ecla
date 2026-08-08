'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Lock, CheckCircle2, Play, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function CoursePage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [units, setUnits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMap() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/course/map`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                setUnits(data.units)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchMap()
    }, [getToken])

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-2">Spanish Foundations</h1>
                <p className="text-zinc-400 mb-10">A1 · Identity & States of Being</p>

                <div className="space-y-12">
                    {units.map((unit) => (
                        <div key={unit.id}>
                            <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">{unit.title}</h2>
                            <div className="space-y-3">
                                {unit.concepts.map((concept: any) => {
                                    const isCompleted = concept.mastery && concept.mastery.correctCount > 0
                                    const isLocked = !concept.isAvailable

                                    return (
                                        <button
                                            key={concept.id}
                                            onClick={() => !isLocked && router.push(`/learn/${concept.id}`)}
                                            disabled={isLocked}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${isLocked
                                                    ? 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                                                    : isCompleted
                                                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                                                        : 'border-zinc-700 bg-zinc-900 hover:border-emerald-500 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                                                    {isLocked ? <Lock className="w-5 h-5 text-zinc-500" /> :
                                                        isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                                                            <Play className="w-5 h-5 text-zinc-400" />}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold">{concept.name}</p>
                                                    <p className="text-sm text-zinc-500">
                                                        {isCompleted ? `Mastered · ${concept.mastery.correctCount} correct` : `${concept.xpReward} XP`}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}