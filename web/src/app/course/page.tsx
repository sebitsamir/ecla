'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    ArrowLeft, ChevronDown, ChevronRight, Crown, Gift,
    Lock, X, CheckCircle2,
    BookOpen, Zap, Music, GraduationCap, type LucideIcon
} from 'lucide-react'
import posthog from 'posthog-js'
import NightBackground from '@/components/NightBackground'
import ModeAmbience from '@/components/ModeAmbience'
import Moon from '@/components/Moon'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { categoryFor} from '@/lib/categories'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const JOKES = [
    "Why don't fireflies ever get lost? They glow with the flow.",
    "What's a firefly's favorite subject? Light-erature.",
    "Why did Ecla ace the test? She was born for glow-ry.",
    "What did Ecla say after dinner? That was light food!",
]

type ModeId = 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL'

const MODE_META: Record<ModeId, {
    id: ModeId; label: string; desc: string;
    dot: string; bg: string; text: string; border: string; glow: string; borderColor: string; Icon: LucideIcon
}> = {
    STORY: {
        id: 'STORY', label: 'Story', desc: 'Learn through narrative',
        dot: 'bg-story', bg: 'bg-story', text: 'text-night-900', border: 'border-story',
        borderColor: 'rgba(255,180,90,0.4)',
        glow: 'shadow-[0_0_24px_rgba(255,180,90,0.35)]', Icon: BookOpen,
    },
    DRILL: {
        id: 'DRILL', label: 'Drill', desc: 'Rapid-fire practice',
        dot: 'bg-drill', bg: 'bg-drill', text: 'text-night-900', border: 'border-drill',
        borderColor: 'rgba(77,216,230,0.4)',
        glow: 'shadow-[0_0_24px_rgba(77,216,230,0.35)]', Icon: Zap,
    },
    IMMERSION: {
        id: 'IMMERSION', label: 'Immersion', desc: 'Culture & native speech',
        dot: 'bg-immersion', bg: 'bg-immersion', text: 'text-night-900', border: 'border-immersion',
        borderColor: 'rgba(185,140,240,0.4)',
        glow: 'shadow-[0_0_24px_rgba(185,140,240,0.35)]', Icon: Music,
    },
    PROFESSIONAL: {
        id: 'PROFESSIONAL', label: 'Professional', desc: 'Formal & workplace',
        dot: 'bg-pro', bg: 'bg-pro', text: 'text-night-900', border: 'border-pro',
        borderColor: 'rgba(127,166,255,0.4)',
        glow: 'shadow-[0_0_24px_rgba(127,166,255,0.35)]', Icon: GraduationCap,
    },
}

type NodeState = 'mastered' | 'struggling' | 'in_progress' | 'current' | 'locked'

const TOP = 110
const SPACING = 175

function smoothPath(pts: { x: number; y: number }[]) {
    if (!pts.length) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
        d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`
    }
    return d
}

export default function CourseMapPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [units, setUnits] = useState<any[]>([])
    const [preferredMode, setPreferredMode] = useState<ModeId>('DRILL')
    const [showModePicker, setShowModePicker] = useState(false)
    const [loading, setLoading] = useState(true)
    const [openConcept, setOpenConcept] = useState<any>(null)
    const [chestOpen, setChestOpen] = useState(false)
    const [joke, setJoke] = useState('')
    const glowColors = useEquippedGlow()

    async function fetchMap() {
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/course/map`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setUnits(data.units)
            if (data.preferredMode && MODE_META[data.preferredMode as ModeId]) {
                setPreferredMode(data.preferredMode as ModeId)
            }
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    useEffect(() => { fetchMap() }, [getToken])

    const switchMode = async (mode: ModeId) => {
        if (mode === preferredMode) { setShowModePicker(false); return }

        const previousMode = preferredMode
        setPreferredMode(mode)
        setShowModePicker(false)

        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/user/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ mode }),
            })
            posthog.capture('mode_switched', { new_mode: mode, source: 'course_map' })
            fetchMap()
        } catch (e) {
            console.error(e)
            setPreferredMode(previousMode)
        }
    }

    const states: Record<string, NodeState> = {}
    let currentFound = false
    for (const u of units) for (const c of u.concepts) {
        if (!c.isAvailable) { states[c.id] = 'locked'; continue }
        if (!currentFound && (c.status === 'not_started' || c.status === 'in_progress')) { states[c.id] = 'current'; currentFound = true }
        else if (c.status === 'mastered') states[c.id] = 'mastered'
        else if (c.status === 'struggling') states[c.id] = 'struggling'
        else if (c.status === 'in_progress') states[c.id] = 'in_progress'
        else states[c.id] = 'locked'
    }

    const openChest = () => {
        setJoke(JOKES[Math.floor(Math.random() * JOKES.length)])
        setChestOpen(true)
        posthog.capture('bonus_chest_opened')
    }

    const openSheet = (concept: any) => {
        setOpenConcept(concept)
        posthog.capture('concept_opened', { concept_id: concept.id })
    }

    const nodeFor = (state: NodeState) => {
        switch (state) {
            case 'mastered': return {
                ring: 'border-glow bg-glow shadow-[0_0_20px_rgba(255,200,87,0.5)]',
                sub: 'Mastered', subCls: 'text-glow'
            }
            case 'current': return {
                ring: 'border-glow bg-night-800 shadow-[0_0_24px_rgba(255,200,87,0.4)]',
                sub: 'Start here', subCls: 'text-glow'
            }
            case 'in_progress': return {
                ring: 'border-drill/60 bg-night-800 shadow-[0_0_16px_rgba(77,216,230,0.25)]',
                sub: 'In progress', subCls: 'text-drill'
            }
            case 'struggling': return {
                ring: 'border-coral/60 bg-night-800 shadow-[0_0_16px_rgba(255,107,107,0.25)]',
                sub: 'Needs review', subCls: 'text-coral'
            }
            default: return {
                ring: 'border-white/10 bg-night-800/60',
                sub: 'Locked', subCls: 'text-cream/25'
            }
        }
    }

    const currentMode = MODE_META[preferredMode]

    return (
        <main className="min-h-screen font-body relative overflow-x-clip">
            <style>{`
                @keyframes node-in { from { opacity: 0; transform: translate(-50%,-50%) scale(.5); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
                .node-in { animation: node-in .55s cubic-bezier(.34,1.56,.64,1) both; }
                @keyframes chest-float { 0%,100% { transform: translate(-50%,-50%) translateY(0); } 50% { transform: translate(-50%,-50%) translateY(-7px); } }
                .chest-float { animation: chest-float 4s ease-in-out infinite; }
                @keyframes firefly-bob { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -6px); } }
                .firefly-bob { animation: firefly-bob 2.5s ease-in-out infinite; }
            `}</style>

            <NightBackground />
            <ModeAmbience mode={preferredMode} />

            <Moon phase="full" size="lg" position="top-right" />

            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <h1 className="font-display text-xl font-bold text-cream">The Path</h1>

                    <button
                        onClick={() => setShowModePicker(true)}
                        className="flex items-center gap-2 rounded-full border bg-night-800/80 pl-2.5 pr-3.5 py-1.5 backdrop-blur-sm hover:bg-night-800 transition-all"
                        style={{ borderColor: currentMode.borderColor, boxShadow: `0 0 24px ${currentMode.borderColor}` }}
                    >
                        <span className={`h-2.5 w-2.5 rounded-full ${currentMode.dot}`} />
                        <span className="text-sm font-semibold text-cream">{currentMode.label}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-cream/50" />
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-10">
                {loading ? (
                    <div className="flex justify-center py-24"><Firefly mood="thinking" size={120} glow={glowColors} /></div>
                ) : units.map((unit: any, unitIndex: number) => {
                    const mastered = unit.concepts.filter((c: any) => c.status === 'mastered').length
                    const pct = unit.concepts.length ? Math.round((mastered / unit.concepts.length) * 100) : 0

                    const items: any[] = []
                    unit.concepts.forEach((c: any, i: number) => {
                        items.push({ kind: 'concept', concept: c })
                        if ((i + 1) % 3 === 0 && i !== unit.concepts.length - 1) items.push({ kind: 'chest' })
                    })

                    const phase = unitIndex * 1.7
                    const pts = items.map((_, k) => ({ x: 500 + 300 * Math.sin(k * 0.9 + phase), y: TOP + k * SPACING }))
                    const H = TOP + (items.length - 1) * SPACING + 170
                    const d = smoothPath(pts)

                    const idxCurrent = items.findIndex((it: any) => it.kind === 'concept' && states[it.concept.id] === 'current')
                    const lit = idxCurrent === -1 ? 100 : Math.max(3, (idxCurrent / Math.max(1, items.length - 1)) * 100)

                    return (
                        <section key={unit.id} className="mb-20">
                            <div className="mb-6 flex items-center justify-between rounded-card bg-night-800/60 border border-white/5 px-6 py-5 backdrop-blur-sm shadow-glow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center font-display font-bold text-glow">{unitIndex + 1}</div>
                                    <div>
                                        <h2 className="font-display text-xl font-bold text-cream">{unit.title}</h2>
                                        <p className="text-xs font-semibold text-cream/50">{mastered}/{unit.concepts.length} mastered</p>
                                    </div>
                                </div>
                                <div className="w-28">
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-glow to-glow-bright" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="mt-1 text-right text-xs font-bold text-glow">{pct}%</p>
                                </div>
                            </div>

                            <div className="relative" style={{ height: H }}>
                                <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id={`trail-${unit.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FFE29A" /><stop offset="100%" stopColor="#FFC857" />
                                        </linearGradient>
                                    </defs>
                                    <path d={d} fill="none" stroke="rgba(244,241,234,0.12)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 12" pathLength={1000} vectorEffect="non-scaling-stroke" />
                                    <path d={d} fill="none" stroke="#FFC857" strokeOpacity="0.35" strokeWidth="9" strokeLinecap="round" pathLength={100} strokeDasharray={`${lit} 100`} vectorEffect="non-scaling-stroke" style={{ filter: 'blur(6px)' }} />
                                    <path d={d} fill="none" stroke={`url(#trail-${unit.id})`} strokeWidth="3.5" strokeLinecap="round" pathLength={100} strokeDasharray={`${lit} 100`} vectorEffect="non-scaling-stroke" />
                                </svg>

                                {items.map((item: any, k: number) => {
                                    const p = pts[k]
                                    const left = `${p.x / 10}%`

                                    if (item.kind === 'chest') {
                                        return (
                                            <div key={`chest-${k}`} className="absolute z-10 chest-float" style={{ left, top: p.y }}>
                                                <button onClick={openChest}
                                                    className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-immersion bg-night-800/70 text-immersion shadow-[0_0_18px_rgba(185,140,240,0.3)] transition-transform hover:scale-110 active:scale-95">
                                                    <Gift className="h-6 w-6" />
                                                </button>
                                            </div>
                                        )
                                    }

                                    const concept = item.concept
                                    const state = states[concept.id]
                                    const { ring, sub, subCls } = nodeFor(state)
                                    const locked = state === 'locked'
                                    const cat = categoryFor(concept.name)
                                    const Icon = cat.icon

                                    return (
                                        <div key={concept.id} className="node-in absolute z-10" style={{ left, top: p.y, animationDelay: `${k * 80}ms` }}>
                                            <div className="relative">
                                                {/* Firefly perches naturally above current node */}
                                                {state === 'current' && (
                                                    <div className="pointer-events-none absolute -top-16 left-1/2 z-20 firefly-bob">
                                                        <Firefly mood="idle" size={72} glow={glowColors} />
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => !locked && openSheet(concept)}
                                                    disabled={locked}
                                                    className={`relative flex h-24 w-24 items-center justify-center rounded-full border-[3px] transition-transform duration-200 ${ring} ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                                                >
                                                    {state === 'current' && (
                                                        <span className="absolute inset-0 animate-pulse rounded-full border-[3px] border-glow/40" />
                                                    )}

                                                    {/* Locked: show lock inside instead of category icon */}
                                                    {locked ? (
                                                        <Lock className="h-8 w-8 text-cream/25" />
                                                    ) : (
                                                        <Icon
                                                            className={`h-10 w-10 ${state === 'mastered' ? 'text-night-900' : ''}`}
                                                            style={state !== 'mastered' ? { color: cat.color } : undefined}
                                                        />
                                                    )}
                                                </button>

                                                {/* Label below — category name shown subtly on hover via title, state text always visible */}
                                                <div className="absolute left-1/2 top-full mt-3 w-max max-w-[180px] -translate-x-1/2 text-center">
                                                    <p
                                                        className={`text-sm font-bold leading-snug mb-0.5 ${locked ? 'text-cream/30' : 'text-cream'}`}
                                                        title={`${cat.label}: ${concept.name}`}
                                                    >
                                                        {concept.name}
                                                    </p>
                                                    <p className={`text-xs font-semibold ${subCls}`}>{sub}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}
            </div>

            {/* Concept sheet */}
            {openConcept && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpenConcept(null)}>
                    <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-night-800 p-6 shadow-glow-md sm:rounded-card sm:p-8" onClick={e => e.stopPropagation()}>
                        <div className="mb-5 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                {(() => {
                                    const cat = categoryFor(openConcept.name); const Icon = cat.icon; return (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/10 bg-night-900 shadow-glow-sm" style={{ color: cat.color }}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    )
                                })()}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: categoryFor(openConcept.name).color }}>
                                        {categoryFor(openConcept.name).label}
                                    </p>
                                    <h3 className="font-display text-xl font-bold text-cream">{openConcept.name}</h3>
                                    <p className="text-xs font-semibold text-cream/50">+{openConcept.xpReward} XP · {openConcept.accuracy}% accuracy</p>
                                </div>
                            </div>
                            <button onClick={() => setOpenConcept(null)} className="rounded-lg p-1.5 text-cream/50 hover:bg-night-700 hover:text-cream transition-colors"><X className="h-5 w-5" /></button>
                        </div>

                        <p className="mb-6 rounded-xl border border-white/5 bg-night-900/60 p-4 text-sm leading-relaxed text-cream/60">
                            {openConcept.grammarNote}
                        </p>

                        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cream/40">
                            <span className={`h-2 w-2 rounded-full ${currentMode.dot}`} />
                            Continue in {currentMode.label} Mode
                        </div>

                        {(() => {
                            const available = (openConcept.modes || []).includes(preferredMode)
                            const ModeIcon = currentMode.Icon
                            if (!available) {
                                return (
                                    <div className="rounded-xl border border-white/10 bg-night-900/40 p-5 text-center">
                                        <Lock className="h-5 w-5 text-cream/40 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-cream/60">This concept isn&apos;t available in {currentMode.label} mode yet.</p>
                                        <p className="text-xs text-cream/40 mt-1">Switch modes above to try a different approach.</p>
                                    </div>
                                )
                            }
                            return (
                                <button
                                    onClick={() => router.push(`/learn/${openConcept.id}?mode=${preferredMode}`)}
                                    className={`w-full py-4 rounded-xl ${currentMode.bg} ${currentMode.text} font-display font-bold text-lg transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 ${currentMode.glow}`}
                                >
                                    <ModeIcon className="h-5 w-5" />
                                    Start Lesson
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            )
                        })()}
                    </div>
                </div>
            )}

            {/* Global Mode Picker */}
            {showModePicker && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowModePicker(false)}>
                    <div className="w-full max-w-sm rounded-t-3xl border border-white/10 bg-night-800 p-6 shadow-glow-md sm:rounded-card sm:p-8" onClick={e => e.stopPropagation()}>
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="font-display text-xl font-bold text-cream">Switch Mode</h3>
                                <p className="text-xs text-cream/50 mt-0.5">Your whole journey reshapes.</p>
                            </div>
                            <button onClick={() => setShowModePicker(false)} className="rounded-lg p-1.5 text-cream/50 hover:bg-night-700 hover:text-cream transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {(Object.keys(MODE_META) as ModeId[]).map(id => {
                                const m = MODE_META[id]
                                const active = id === preferredMode
                                const MIcon = m.Icon
                                return (
                                    <button
                                        key={id}
                                        onClick={() => switchMode(id)}
                                        className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 transition-all ${active ? 'border-white/25 bg-night-900' : 'border-white/10 bg-night-900/60 hover:border-white/25'}`}
                                        style={active ? { boxShadow: `0 0 24px ${m.borderColor}` } : undefined}
                                    >
                                        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.bg} ${m.text}`}>
                                            <MIcon className="h-5 w-5" />
                                        </span>
                                        <span className="flex-1 text-left">
                                            <span className="block font-display text-sm font-bold text-cream">{m.label}</span>
                                            <span className="block text-xs text-cream/50">{m.desc}</span>
                                        </span>
                                        {active && <CheckCircle2 className="h-4 w-4 text-glow" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bonus chest modal */}
            {chestOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-card border border-white/10 bg-night-800 p-8 text-center shadow-glow-md">
                        <div className="mb-4 flex justify-center"><Firefly mood="proud" size={110} glow={glowColors}/></div>
                        <h3 className="font-display mb-2 text-2xl font-bold text-cream">Bonus Chest!</h3>
                        <p className="mb-6 text-sm leading-relaxed text-cream/70">{joke}</p>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-glow/30 bg-glow/10 px-4 py-2 text-sm font-bold text-glow">+15 XP</div>
                        <button onClick={() => setChestOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-glow py-3 font-bold text-night-900 transition-colors hover:bg-glow-bright">
                            <X className="h-4 w-4" /> Keep going
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}