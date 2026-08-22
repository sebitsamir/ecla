'use client'

/**
 * Can-Do Truth Panel — ECLA Dashboard Component
 * 
 * Constitution Art. 3: "Every level answers 'What can the learner DO in the real world?'"
 * Art. 24: "Evidence before certification"
 * 
 * This component reads the learner's dimensional mastery scores and displays
 * their actual demonstrated abilities, grouped by mastery level.
 * 
 * Data source: GET /api/v1/learner/competencies
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
    Target, TrendingUp, TrendingDown, ChevronDown, ChevronRight,
    CheckCircle2, Clock, Circle, Sparkles
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Competency = {
    competencyId: string
    competencyCode: string
    competencyTitle: string
    canDo: string
    domain: string
    level: string
    overallScore: number | null
    dimensions: {
        comprehension: number | null
        retrieval: number | null
        interaction: number | null
        application: number | null
        transfer: number | null
    }
    lastAssessedAt: string | null
    nextReviewAt: string | null
}

type LearnerData = {
    competencies: Competency[]
    summary: {
        totalCompetencies: number
        mastered: number
        developing: number
        notStarted: number
        weakestDimension: string | null
        strongestDimension: string | null
    }
}

const LEVEL_CONFIG = {
    TRANSFERRED: { label: 'Mastered', icon: CheckCircle2, color: 'text-leaf', bg: 'bg-leaf/10 border-leaf/30' },
    RETAINED: { label: 'Retained', icon: CheckCircle2, color: 'text-leaf', bg: 'bg-leaf/10 border-leaf/30' },
    CONTROLLED: { label: 'Controlled', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
    DEVELOPING: { label: 'Developing', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
    EXPOSED: { label: 'Exposed', icon: Circle, color: 'text-cream/40', bg: 'bg-cream/5 border-cream/10' },
    NOT_STARTED: { label: 'Not Started', icon: Circle, color: 'text-cream/40', bg: 'bg-cream/5 border-cream/10' },
}

const DIMENSION_LABELS: Record<string, string> = {
    comprehension: 'Comprehension',
    retrieval: 'Retrieval',
    interaction: 'Interaction',
    application: 'Application',
    transfer: 'Transfer',
}

export default function CanDoPanel() {
    const { getToken } = useAuth()
    const [data, setData] = useState<LearnerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['TRANSFERRED', 'CONTROLLED']))

    useEffect(() => {
        async function fetchLearnerData() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/learner/competencies`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (e) {
                console.error('Failed to fetch learner data:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchLearnerData()
    }, [getToken])

    const toggleGroup = (level: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(level)) next.delete(level)
            else next.add(level)
            return next
        })
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-night-800/50 p-6 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                    <div className="h-16 bg-white/5 rounded" />
                    <div className="h-16 bg-white/5 rounded" />
                </div>
            </div>
        )
    }

    if (!data || data.competencies.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-night-800/50 p-6 text-center">
                <Target className="h-8 w-8 text-cream/30 mx-auto mb-3" />
                <p className="text-sm text-cream/60">Complete lessons to see your abilities here.</p>
            </div>
        )
    }

    const { competencies, summary } = data

    // Group competencies by level
    const grouped = competencies.reduce((acc, c) => {
        const key = c.level
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
    }, {} as Record<string, Competency[]>)

    // Dimension bars for a competency
    const DimensionBars = ({ dims }: { dims: Competency['dimensions'] }) => (
        <div className="space-y-2 mt-3">
            {Object.entries(dims).map(([key, value]) => {
                if (value === null) return null
                return (
                    <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-cream/50 w-20 flex-shrink-0">
                            {DIMENSION_LABELS[key]}
                        </span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-glow transition-all duration-500"
                                style={{ width: `${value}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-cream/60 w-8 text-right">{value}%</span>
                    </div>
                )
            })}
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="rounded-2xl border border-glow/20 bg-glow/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-glow" />
                    <h2 className="font-display text-lg font-bold text-cream">Your Abilities</h2>
                </div>
                <p className="text-xs text-cream/60 mb-3">
                    What you can actually do in Spanish, based on demonstrated evidence.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-2xl font-bold text-leaf">{summary.mastered}</p>
                        <p className="text-[10px] text-cream/50">Mastered</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-amber-400">{summary.developing}</p>
                        <p className="text-[10px] text-cream/50">Developing</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-cream/40">{summary.notStarted}</p>
                        <p className="text-[10px] text-cream/50">Not Started</p>
                    </div>
                </div>
            </div>

            {/* Dimensional Summary */}
            {(summary.weakestDimension || summary.strongestDimension) && (
                <div className="rounded-xl border border-white/10 bg-night-800/50 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-3">
                        Your Profile
                    </h3>
                    <div className="space-y-2">
                        {summary.strongestDimension && (
                            <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-leaf flex-shrink-0" />
                                <span className="text-cream/80">
                                    Strongest: <span className="font-bold text-leaf">{DIMENSION_LABELS[summary.strongestDimension]}</span>
                                </span>
                            </div>
                        )}
                        {summary.weakestDimension && (
                            <div className="flex items-center gap-2 text-sm">
                                <TrendingDown className="h-4 w-4 text-coral flex-shrink-0" />
                                <span className="text-cream/80">
                                    Weakest: <span className="font-bold text-coral">{DIMENSION_LABELS[summary.weakestDimension]}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Competency Groups */}
            {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
                const items = grouped[level]
                if (!items || items.length === 0) return null

                const Icon = config.icon
                const isExpanded = expandedGroups.has(level)

                return (
                    <div key={level} className="rounded-xl border border-white/10 bg-night-800/50 overflow-hidden">
                        <button
                            onClick={() => toggleGroup(level)}
                            className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                        >
                            <Icon className={`h-5 w-5 ${config.color} flex-shrink-0`} />
                            <span className="font-bold text-cream flex-1 text-left">
                                {config.label}
                            </span>
                            <span className="text-sm text-cream/50">{items.length}</span>
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-cream/40" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-cream/40" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="border-t border-white/5">
                                {items.map((comp, i) => (
                                    <div
                                        key={comp.competencyId}
                                        className={`p-4 ${i > 0 ? 'border-t border-white/5' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                                                <Icon className={`h-4 w-4 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-cream/50 mb-0.5">{comp.competencyCode}</p>
                                                <p className="font-bold text-cream text-sm mb-1">{comp.competencyTitle}</p>
                                                <p className="text-xs text-cream/70 italic">
                                                    "I can {comp.canDo.toLowerCase()}"
                                                </p>
                                                {comp.overallScore !== null && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-glow transition-all duration-500"
                                                                style={{ width: `${comp.overallScore}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-cream/60">{comp.overallScore}%</span>
                                                    </div>
                                                )}
                                                <DimensionBars dims={comp.dimensions} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}