'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Lock, Crown, Play, Loader2, AlertTriangle } from 'lucide-react'

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

        const handleUpdate = () => { setLoading(true); fetchMap(); }
        window.addEventListener('ecla:progress-updated', handleUpdate)
        window.addEventListener('focus', handleUpdate)

        return () => {
            window.removeEventListener('ecla:progress-updated', handleUpdate)
            window.removeEventListener('focus', handleUpdate)
        }
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
                                    const isLocked = !concept.isAvailable
                                    const isMastered = concept.status === 'mastered'
                                    const isStruggling = concept.status === 'struggling'
                                    const isInProgress = concept.status === 'in_progress'

                                    let borderClass = 'border-zinc-700 bg-zinc-900 hover:border-emerald-500 hover:bg-zinc-800'
                                    let iconBg = 'bg-zinc-800'
                                    let Icon = Play
                                    let iconColor = 'text-zinc-400'
                                    let statusText = `${concept.xpReward} XP`

                                    if (isLocked) {
                                        borderClass = 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                                        Icon = Lock
                                        iconColor = 'text-zinc-500'
                                    } else if (isMastered) {
                                        borderClass = 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400'
                                        iconBg = 'bg-emerald-500/20'
                                        Icon = Crown
                                        iconColor = 'text-emerald-400'
                                        statusText = `Mastered · ${concept.accuracy}%`
                                    } else if (isStruggling) {
                                        borderClass = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-400'
                                        iconBg = 'bg-amber-500/20'
                                        Icon = AlertTriangle
                                        iconColor = 'text-amber-400'
                                        statusText = `Needs Review · ${concept.accuracy}%`
                                    } else if (isInProgress) {
                                        borderClass = 'border-blue-500/40 bg-blue-500/5 hover:border-blue-400'
                                        iconBg = 'bg-blue-500/20'
                                        Icon = Play
                                        iconColor = 'text-blue-400'
                                        statusText = `In Progress · ${concept.accuracy}%`
                                    }

                                    return (
                                        <button
                                            key={concept.id}
                                            onClick={() => !isLocked && router.push(`/learn/${concept.id}`)}
                                            disabled={isLocked}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${borderClass}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${iconBg}`}>
                                                    <Icon className={`w-5 h-5 ${iconColor}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold">{concept.name}</p>
                                                    <p className="text-sm text-zinc-500">{statusText}</p>
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