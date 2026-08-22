'use client'

/**
 * Next Up Card — Adaptive Engine UI
 *
 * Displays the learner's next recommended activity based on their
 * dimensional mastery profile. Shows:
 * - Competency title + can-do statement
 * - Weakest dimension + recommended mode
 * - Reason (overdue, weak dimension, next in sequence)
 * - CTA to start the lesson
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    Target, TrendingDown, ArrowRight, BookOpen, Puzzle, Ear,
    Lightbulb, MessageCircle, Sparkles,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Recommendation = {
    competencyId: string
    competencyCode: string
    competencyTitle: string
    canDo: string
    weakestDimension: string | null
    weakestScore: number | null
    recommendedMode: string
    reason: string
    priority: number
}

const MODE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    STORY: { icon: BookOpen, color: 'text-blue-400', label: 'Story' },
    DRILL: { icon: Puzzle, color: 'text-orange-400', label: 'Drill' },
    IMMERSION: { icon: Ear, color: 'text-emerald-400', label: 'Immersion' },
    PROFESSIONAL: { icon: Lightbulb, color: 'text-amber-400', label: 'Professional' },
    MISSION: { icon: MessageCircle, color: 'text-purple-400', label: 'Mission' },
}

export default function NextUpCard() {
    const { getToken } = useAuth()
    const router = useRouter()
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRecommendation() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/learner/next-activity`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setRecommendation(data.recommendation)
                }
            } catch (e) {
                console.error('Failed to fetch recommendation:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchRecommendation()
    }, [getToken])

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-night-800/50 p-5 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-1/3 mb-3" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
            </div>
        )
    }

    if (!recommendation) {
        return (
            <div className="rounded-2xl border border-white/10 bg-night-800/50 p-5 text-center">
                <Sparkles className="h-6 w-6 text-cream/30 mx-auto mb-2" />
                <p className="text-sm text-cream/60">All competencies completed! 🎉</p>
            </div>
        )
    }

    const modeConfig = MODE_CONFIG[recommendation.recommendedMode] ?? MODE_CONFIG.DRILL
    const ModeIcon = modeConfig.icon

    return (
        <div className="rounded-2xl border border-glow/20 bg-gradient-to-br from-night-800/80 to-night-900/80 p-5">
            <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-glow" />
                <h3 className="font-display text-lg font-bold text-cream">Next up</h3>
            </div>

            <div className="mb-4">
                <p className="text-xs text-cream/50 mb-1">{recommendation.competencyCode}</p>
                <p className="font-bold text-cream text-sm mb-1">{recommendation.competencyTitle}</p>
                <p className="text-xs text-cream/70 italic">"{recommendation.canDo}"</p>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <ModeIcon className={`h-4 w-4 ${modeConfig.color}`} />
                <span className="text-xs font-bold text-cream/80">{modeConfig.label}</span>
                {recommendation.weakestDimension && (
                    <>
                        <span className="text-cream/40">·</span>
                        <TrendingDown className="h-3 w-3 text-coral" />
                        <span className="text-xs text-coral capitalize">{recommendation.weakestDimension}</span>
                        {recommendation.weakestScore !== null && (
                            <span className="text-xs text-cream/50">({recommendation.weakestScore}%)</span>
                        )}
                    </>
                )}
            </div>

            <p className="text-xs text-cream/50 mb-4">{recommendation.reason}</p>

            <button
                onClick={() => router.push(`/learn/${recommendation.competencyId}?mode=${recommendation.recommendedMode}`)}
                className="w-full py-3 rounded-xl bg-glow text-night-900 font-bold text-sm hover:bg-glow-bright flex items-center justify-center gap-2"
            >
                Start Practice
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    )
}