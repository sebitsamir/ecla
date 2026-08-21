'use client'

/**
 * Course Map Page: Visual Learning Path
 * 
 * This page displays the student's learning journey as a visual path/map with
 * interconnected concepts organized into units. It's the main navigation hub
 * for the learning experience.
 * 
 * Key Features:
 * - Visual path with nodes representing learning concepts
 * - Unit progress tracking with mastery indicators
 * - 4 learning modes (Story, Drill, Immersion, Professional) that reshape the journey
 * - Concept sheets showing 4-part sub-lessons (Understand → Hear → Watch out → Use it)
 * - Bonus chests with jokes for engagement
 * - Progress persistence across sessions
 * 
 * Architecture:
 * - Course data fetched from backend API (/api/v1/course/map)
 * - Concept states calculated client-side based on completion data
 * - Mode preference persisted in localStorage and synced to backend
 * - Sub-lesson data fetched on-demand when opening concept sheets
 * - Path drawn using SVG with smooth Bezier curves
 * 
 * Node States:
 * - mastered: Concept fully completed with high accuracy
 * - completed: Concept finished but not yet mastered
 * - current: Next concept to work on (highlighted with Firefly)
 * - in_progress: Started but not finished
 * - struggling: Low accuracy, needs review
 * - locked: Not yet available (previous concept not finished)
 * 
 * API Endpoints Used:
 * - GET /api/v1/course/map: Fetches all units and concepts with progress
 * - GET /api/v1/lessons/{id}: Fetches sub-lessons for a specific concept
 * - POST /api/v1/user/mode: Updates the user's preferred learning mode
 * 
 * Loading Strategy:
 * The page renders immediately with skeleton placeholders while data loads.
 * This provides instant visual feedback instead of a blank screen.
 * The skeleton shows the expected structure (header + unit cards + nodes)
 * and smoothly transitions to real content when data arrives.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    ArrowLeft, ChevronDown, Gift,
    Lock, X, CheckCircle2,
    BookOpen, Zap, Music, GraduationCap, type LucideIcon,
    BookOpenCheck, Ear, MessageCircle, Puzzle, Lightbulb, Sparkles,
    ArrowRight, AlertTriangle
} from 'lucide-react'
import posthog from 'posthog-js'
import NightBackground from '@/components/NightBackground'
import ModeAmbience from '@/components/ModeAmbience'
import Moon from '@/components/Moon'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { categoryFor } from '@/lib/categories'
import type { SubLessonData } from '@/lib/lessonTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Bonus chest jokes shown when students open reward chests
 * These add personality and engagement to the learning path
 */
const JOKES = [
    "Why don't fireflies ever get lost? They glow with the flow.",
    "What's a firefly's favorite subject? Light-erature.",
    "Why did Ecla ace the test? She was born for glow-ry.",
    "What did Ecla say after dinner? That was light food!",
]

/**
 * Learning mode identifiers
 * Each mode reshapes the entire course to match the student's learning style
 */
type ModeId = 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL'

/**
 * Mode metadata defining visual styling, icons, and descriptions
 * 
 * Each mode has:
 * - Unique color scheme (dot, bg, border, glow)
 * - Distinct icon from Lucide
 * - Description shown in mode picker
 * - Shadow/glow effects for visual emphasis
 */
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

/**
 * Node states for concepts on the learning path
 * These determine visual styling and interactivity
 */
type NodeState = 'mastered' | 'completed' | 'struggling' | 'in_progress' | 'current' | 'locked'

/**
 * Path layout constants
 * TOP: Y position of first node
 * SPACING: Vertical distance between nodes
 */
const TOP = 110
const SPACING = 175

/**
 * Icon mapping for sub-lesson types
 * Maps string identifiers to Lucide icon components
 */
const ICON_MAP: Record<string, any> = {
    'book-open': BookOpenCheck,
    'ear': Ear,
    'message-circle': MessageCircle,
    'puzzle': Puzzle,
    'lightbulb': Lightbulb,
    'sparkles': Sparkles,
    'alert-triangle': AlertTriangle,
}

/**
 * Generates smooth SVG path using Catmull-Rom spline interpolation
 * 
 * This creates flowing curves between nodes instead of straight lines,
 * making the learning path feel organic and engaging.
 * 
 * @param pts - Array of {x, y} coordinates for each node
 * @returns SVG path data string (d attribute)
 */
function smoothPath(pts: { x: number; y: number }[]) {
    if (!pts.length) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
        d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`
    }
    return d
}

/**
 * Skeleton loader shown while course data loads
 * Shows expected structure to reduce perceived loading time
 */
function CourseSkeleton() {
    return (
        <>
            {/* Skeleton unit header */}
            <div className="mb-5 sm:mb-6 animate-pulse">
                <div className="flex items-center justify-between rounded-card bg-night-800/60 border border-white/5 px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-night-800" />
                        <div className="space-y-2">
                            <div className="h-5 w-32 sm:w-48 bg-night-800 rounded" />
                            <div className="h-3 w-24 bg-night-800 rounded" />
                        </div>
                    </div>
                    <div className="w-24 sm:w-28 space-y-2">
                        <div className="h-2 bg-night-800 rounded-full" />
                        <div className="h-3 w-8 bg-night-800 rounded ml-auto" />
                    </div>
                </div>
            </div>

            {/* Skeleton nodes */}
            <div className="relative" style={{ height: 600 }}>
                {[0, 1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="absolute animate-pulse"
                        style={{
                            left: `${50 + Math.sin(i * 0.9) * 30}%`,
                            top: TOP + i * SPACING,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-night-800/60 border-[3px] border-white/10" />
                        <div className="mt-3 space-y-1.5 text-center">
                            <div className="h-4 w-24 bg-night-800 rounded mx-auto" />
                            <div className="h-3 w-16 bg-night-800 rounded mx-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

/**
 * Course Map Page Component
 * 
 * Main component that renders the entire learning path experience.
 * 
 * State Management:
 * - units: Array of learning units with their concepts
 * - preferredMode: Current learning mode (persisted to localStorage)
 * - mounted: Tracks if component has mounted (for hydration safety)
 * - showModePicker: Controls mode selection modal
 * - loading: Tracks if course data is being fetched
 * - openConcept: Currently selected concept for detail sheet
 * - subLessons: Sub-lessons for the open concept
 * - completedSubIds: IDs of completed sub-lessons
 * - chestOpen: Controls bonus chest modal
 * - joke: Current joke displayed in chest
 * 
 * Loading Strategy:
 * The page renders immediately with skeleton placeholders.
 * No blocking loader - structure appears instantly, content fills in.
 */
export default function CourseMapPage() {
    const router = useRouter()
    const { getToken } = useAuth()

    // ── Core Data State ──
    const [units, setUnits] = useState<any[]>([])

    // ── Mode State ──
    const [preferredMode, setPreferredMode] = useState<ModeId>(() => {
        // Initialize from localStorage on client-side only
        if (typeof window === 'undefined') return 'DRILL'
        const stored = localStorage.getItem('ecla-preferred-mode') as ModeId | null
        return stored && MODE_META[stored] ? stored : 'DRILL'
    })

    // ── UI State ──
    const [mounted, setMounted] = useState(false)
    const [showModePicker, setShowModePicker] = useState(false)
    const [loading, setLoading] = useState(true)

    // ── Concept Sheet State ──
    const [openConcept, setOpenConcept] = useState<any>(null)
    const [subLessons, setSubLessons] = useState<SubLessonData[]>([])
    const [completedSubIds, setCompletedSubIds] = useState<string[]>([])
    const [loadingSubs, setLoadingSubs] = useState(false)

    // ── Bonus Chest State ──
    const [chestOpen, setChestOpen] = useState(false)
    const [joke, setJoke] = useState('')

    const glowColors = useEquippedGlow()

    /**
     * Mark component as mounted after hydration
     * This prevents hydration mismatches when reading localStorage
     */
    useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem('ecla-preferred-mode') as ModeId | null
        if (stored && MODE_META[stored]) {
            setPreferredMode(stored)
        }
    }, [])

    /**
     * Fetch course map data from backend
     * 
     * Retrieves all units and concepts with their progress status.
     * Also syncs the preferred mode from backend to localStorage.
     */
    async function fetchMap() {
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/course/map`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setUnits(data.units)
            if (data.preferredMode && MODE_META[data.preferredMode as ModeId]) {
                const mode = data.preferredMode as ModeId
                setPreferredMode(mode)
                localStorage.setItem('ecla-preferred-mode', mode)
            }
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    /**
     * Fetch course map on mount
     */
    useEffect(() => { fetchMap() }, [getToken])

    /**
     * Refetch when returning from a lesson or when window regains focus
     * This ensures progress updates are reflected immediately
     */
    useEffect(() => {
        const handleUpdate = () => fetchMap()
        window.addEventListener('luma:progress-updated', handleUpdate)
        window.addEventListener('focus', handleUpdate)
        return () => {
            window.removeEventListener('luma:progress-updated', handleUpdate)
            window.removeEventListener('focus', handleUpdate)
        }
    }, [getToken])

    /**
     * Switch learning mode
     * 
     * Updates the preferred mode in:
     * 1. Local state (immediate UI update)
     * 2. localStorage (persistence)
     * 3. Backend API (sync across devices)
     * 
     * @param mode - The new mode to switch to
     */
    const switchMode = async (mode: ModeId) => {
        if (mode === preferredMode) { setShowModePicker(false); return }

        const previousMode = preferredMode
        setPreferredMode(mode)
        setShowModePicker(false)
        localStorage.setItem('ecla-preferred-mode', mode)

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
            // Revert on failure
            setPreferredMode(previousMode)
            localStorage.setItem('ecla-preferred-mode', previousMode)
        }
    }

    /**
     * Fetch sub-lessons for a specific concept
     * 
     * Sub-lessons are the 4-part journey within each concept:
     * 1. Understand - Grammar and core concepts
     * 2. Hear it - Audio examples and pronunciation
     * 3. Watch out - Common mistakes
     * 4. Use it - Real-world practice
     * 
     * @param conceptId - ID of the concept to fetch sub-lessons for
     */
    const fetchSubLessons = async (conceptId: string) => {
        setLoadingSubs(true)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/lessons/${conceptId}?mode=${preferredMode}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setSubLessons(data.lesson.subLessons || [])
            setCompletedSubIds(data.lesson.completedSubLessonIds || [])
        } catch (e) {
            console.error(e)
            setSubLessons([])
            setCompletedSubIds([])
        } finally {
            setLoadingSubs(false)
        }
    }

    /**
     * Check if a concept is finished
     * 
     * A concept is finished when ALL its sub-lessons are completed.
     * This determines whether the next concept unlocks.
     * 
     * @param c - Concept object from the API
     * @returns true if all sub-lessons are completed
     */
    const isFinished = (c: any) => {
        const total = c.totalSubLessons || 0
        if (total > 0) return (c.completedSubLessons || 0) >= total
        return c.status === 'mastered'
    }

    /**
     * Calculate node states for all concepts
     * 
     * This determines the visual state of each node on the path:
     * - First unfinished concept becomes 'current' (highlighted)
     * - All concepts after current are 'locked'
     * - Finished concepts get their actual status (mastered/completed/struggling)
     * 
     * The path is linear - you must finish one concept before the next unlocks.
     */
    const states: Record<string, NodeState> = {}
    let currentFound = false
    const allConcepts: any[] = []
    for (const u of units) for (const c of u.concepts) allConcepts.push(c)

    for (let i = 0; i < allConcepts.length; i++) {
        const c = allConcepts[i]
        if (!c.isAvailable) { states[c.id] = 'locked'; continue }

        if (isFinished(c)) {
            states[c.id] = c.status === 'mastered' ? 'mastered'
                : c.status === 'struggling' ? 'struggling'
                    : 'completed'
            continue
        }

        if (!currentFound) { states[c.id] = 'current'; currentFound = true }
        else states[c.id] = 'locked'
    }

    /**
     * Open bonus chest and show random joke
     */
    const openChest = () => {
        setJoke(JOKES[Math.floor(Math.random() * JOKES.length)])
        setChestOpen(true)
        posthog.capture('bonus_chest_opened')
    }

    /**
     * Open concept detail sheet
     * 
     * Clears previous sub-lesson data and fetches new data for the selected concept.
     * 
     * @param concept - Concept object to display
     */
    const openSheet = (concept: any) => {
        setOpenConcept(concept)
        setSubLessons([])
        setCompletedSubIds([])
        fetchSubLessons(concept.id)
        posthog.capture('concept_opened', { concept_id: concept.id })
    }

    /**
     * Get visual styling for a node based on its state
     * 
     * Returns ring color, background, shadow, and label styling
     * for each possible node state.
     * 
     * @param state - The node's current state
     * @returns Object with ring classes, label text, and label classes
     */
    const nodeFor = (state: NodeState) => {
        switch (state) {
            case 'mastered': return {
                ring: 'border-glow bg-glow shadow-[0_0_20px_rgba(255,200,87,0.5)]',
                sub: 'Mastered', subCls: 'text-glow'
            }
            case 'completed': return {
                ring: 'border-leaf/60 bg-night-800 shadow-[0_0_16px_rgba(107,220,140,0.25)]',
                sub: 'Completed', subCls: 'text-leaf'
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
    const totalSubLessonXP = subLessons.reduce((sum, sub) => sum + (sub.xpReward || 0), 0)

    return (
        <main className="min-h-screen font-body relative overflow-x-clip">
            <style>{`
                @keyframes node-in { from { opacity: 0; transform: translate(-50%,-50%) scale(.5); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
                .node-in { animation: node-in .55s cubic-bezier(.34,1.56,.64,1) both; }
                @keyframes chest-float { 0%,100% { transform: translate(-50%,-50%) translateY(0); } 50% { transform: translate(-50%,-50%) translateY(-7px); } }
                .chest-float { animation: chest-float 4s ease-in-out infinite; }
                @keyframes firefly-bob { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -6px); } }
                .firefly-bob { animation: firefly-bob 2.5s ease-in-out infinite; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            <NightBackground />
            <ModeAmbience mode={preferredMode} />

            <Moon phase="full" size="lg" position="top-right" />

            {/* ── Header with mode selector ─ */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
                <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 sm:gap-2 text-cream/60 hover:text-cream transition-colors text-xs sm:text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <h1 className="font-display text-lg sm:text-xl font-bold text-cream">The Path</h1>

                    {/* Mode selector button */}
                    <button
                        onClick={() => setShowModePicker(true)}
                        className="flex items-center gap-1.5 sm:gap-2 rounded-full border bg-night-800/80 pl-2 pr-2.5 sm:pl-2.5 sm:pr-3.5 py-1 sm:py-1.5 backdrop-blur-sm hover:bg-night-800 transition-all"
                        style={{ borderColor: currentMode.borderColor, boxShadow: `0 0 24px ${currentMode.borderColor}` }}
                    >
                        <span className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${currentMode.dot}`} />
                        <span className="text-xs sm:text-sm font-semibold text-cream">{currentMode.label}</span>
                        <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cream/50" />
                    </button>
                </div>
            </header>

            {/* ── Course Path ─ */}
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
                {/* Show skeleton while loading, real content when ready */}
                {loading ? (
                    <CourseSkeleton />
                ) : units.map((unit: any, unitIndex: number) => {
                    const mastered = unit.concepts.filter((c: any) => c.status === 'mastered').length
                    const pct = unit.concepts.length ? Math.round((mastered / unit.concepts.length) * 100) : 0

                    /* Build items array: concepts + bonus chests every 3 concepts */
                    const items: any[] = []
                    unit.concepts.forEach((c: any, i: number) => {
                        items.push({ kind: 'concept', concept: c })
                        if ((i + 1) % 3 === 0 && i !== unit.concepts.length - 1) items.push({ kind: 'chest' })
                    })

                    /* Calculate node positions using sine wave for organic path */
                    const phase = unitIndex * 1.7
                    const pts = items.map((_, k) => ({ x: 500 + 300 * Math.sin(k * 0.9 + phase), y: TOP + k * SPACING }))
                    const H = TOP + (items.length - 1) * SPACING + 170
                    const d = smoothPath(pts)

                    /* Calculate how much of the path is lit (completed)
                    - Unit containing the current node → partial lit up to it
                    - Fully finished unit → 100
                    - Untouched unit → 0 (dashed only)                        */
                    const FINISHED_STATES = ['mastered', 'completed', 'struggling']
                    const conceptItems = items.filter((it: any) => it.kind === 'concept')
                    const idxCurrent = items.findIndex((it: any) => it.kind === 'concept' && states[it.concept.id] === 'current')
                    const allFinished = conceptItems.length > 0 && conceptItems.every((it: any) => FINISHED_STATES.includes(states[it.concept.id]))
                    const lit = idxCurrent !== -1
                        ? Math.max(3, (idxCurrent / Math.max(1, items.length - 1)) * 100)
                        : allFinished ? 100 : 0

                    return (
                        <section key={unit.id} className="mb-16 sm:mb-20">
                            {/* ── Unit Header with Progress ─ */}
                            <div className="mb-5 sm:mb-6 flex items-center justify-between rounded-card bg-night-800/60 border border-white/5 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-sm shadow-glow-sm">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center font-display font-bold text-glow text-sm sm:text-base">{unitIndex + 1}</div>
                                    <div>
                                        <h2 className="font-display text-base sm:text-xl font-bold text-cream">{unit.title}</h2>
                                        <p className="text-[11px] sm:text-xs font-semibold text-cream/50">{mastered}/{unit.concepts.length} mastered</p>
                                    </div>
                                </div>
                                <div className="w-24 sm:w-28">
                                    <div className="h-1.5 sm:h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-glow to-glow-bright transition-all duration-700" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="mt-1 text-right text-[11px] sm:text-xs font-bold text-glow">{pct}%</p>
                                </div>
                            </div>

                            {/* ── Path with Nodes ─ */}
                            <div className="relative" style={{ height: H }}>
                                {/* SVG path with gradient and glow */}
                                <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id={`trail-${unit.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FFE29A" /><stop offset="100%" stopColor="#FFC857" />
                                        </linearGradient>
                                    </defs>
                                    {/* Dashed background path */}
                                    <path d={d} fill="none" stroke="rgba(244,241,234,0.12)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 12" pathLength={1000} vectorEffect="non-scaling-stroke" />
                                    {/* Glowing progress trail */}
                                    <path d={d} fill="none" stroke="#FFC857" strokeOpacity="0.35" strokeWidth="9" strokeLinecap="round" pathLength={100} strokeDasharray={`${lit} 100`} vectorEffect="non-scaling-stroke" style={{ filter: 'blur(6px)' }} />
                                    {/* Solid progress trail */}
                                    <path d={d} fill="none" stroke={`url(#trail-${unit.id})`} strokeWidth="3.5" strokeLinecap="round" pathLength={100} strokeDasharray={`${lit} 100`} vectorEffect="non-scaling-stroke" />
                                </svg>

                                {/* ── Nodes (Concepts and Chests) ─ */}
                                {items.map((item: any, k: number) => {
                                    const p = pts[k]
                                    const left = `${p.x / 10}%`

                                    /* Bonus chest node */
                                    if (item.kind === 'chest') {
                                        return (
                                            <div key={`chest-${k}`} className="absolute z-10 chest-float" style={{ left, top: p.y }}>
                                                <button onClick={openChest}
                                                    className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 border-dashed border-immersion bg-night-800/70 text-immersion shadow-[0_0_18px_rgba(185,140,240,0.3)] transition-transform hover:scale-110 active:scale-95">
                                                    <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </button>
                                            </div>
                                        )
                                    }

                                    /* Concept node */
                                    const concept = item.concept
                                    const state = states[concept.id]
                                    const { ring, sub, subCls } = nodeFor(state)
                                    const locked = state === 'locked'
                                    const cat = categoryFor(concept.name)
                                    const Icon = cat.icon

                                    return (
                                        <div key={concept.id} className="node-in absolute z-10" style={{ left, top: p.y, animationDelay: `${k * 80}ms` }}>
                                            <div className="relative">
                                                {/* Firefly indicator for current concept */}
                                                {state === 'current' && (
                                                    <div className="pointer-events-none absolute -top-12 sm:-top-16 left-1/2 z-20 firefly-bob">
                                                        <Firefly mood="idle" size={56} glow={glowColors} />
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => !locked && openSheet(concept)}
                                                    disabled={locked}
                                                    className={`relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-[3px] transition-transform duration-200 ${ring} ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                                                >
                                                    {/* Pulse ring for current concept */}
                                                    {state === 'current' && (
                                                        <span className="absolute inset-0 animate-pulse rounded-full border-[3px] border-glow/40" />
                                                    )}

                                                    {/* Node icon */}
                                                    {locked ? (
                                                        <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-cream/25" />
                                                    ) : (
                                                        <Icon
                                                            className={`h-8 w-8 sm:h-10 sm:w-10 ${state === 'mastered' ? 'text-night-900' : ''}`}
                                                            style={state !== 'mastered' ? { color: cat.color } : undefined}
                                                        />
                                                    )}

                                                    {/* Sub-lesson progress ring */}
                                                    {!locked && concept.subLessonProgress > 0 && concept.subLessonProgress < 100 && (
                                                        <svg className="absolute inset-0" viewBox="0 0 100 100">
                                                            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                                            <circle
                                                                cx="50" cy="50" r="48"
                                                                fill="none"
                                                                stroke={state === 'mastered' ? '#FFC857' : '#4DD8E6'}
                                                                strokeWidth="4"
                                                                strokeDasharray={`${2 * Math.PI * 48}`}
                                                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - concept.subLessonProgress / 100)}`}
                                                                strokeLinecap="round"
                                                                transform="rotate(-90 50 50)"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>

                                                {/* Concept label below node */}
                                                <div className="absolute left-1/2 top-full mt-2 sm:mt-3 w-max max-w-[160px] sm:max-w-[180px] -translate-x-1/2 text-center">
                                                    <p
                                                        className={`text-xs sm:text-sm font-bold leading-snug mb-0.5 ${locked ? 'text-cream/30' : 'text-cream'}`}
                                                        title={`${cat.label}: ${concept.name}`}
                                                    >
                                                        {concept.name}
                                                    </p>
                                                    <p className={`text-[11px] sm:text-xs font-semibold ${subCls}`}>
                                                        {state === 'current' && (concept.completedSubLessons || 0) > 0 ? 'Continue' : sub}
                                                    </p>
                                                    {!locked && concept.subLessonProgress > 0 && (
                                                        <p className="text-[10px] text-cream/40 mt-0.5">
                                                            {concept.completedSubLessons}/{concept.totalSubLessons} parts
                                                        </p>
                                                    )}
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

            {/* ── Concept Detail Sheet Modal ─ */}
            {openConcept && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpenConcept(null)}>
                    <div
                        className="no-scrollbar w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-night-800 p-4 sm:p-6 shadow-glow-md sm:rounded-3xl sm:p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Sheet header with concept info */}
                        <div className="flex items-start justify-between mb-4 sm:mb-6">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                {(() => {
                                    const cat = categoryFor(openConcept.name); const Icon = cat.icon; return (
                                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 border-white/10 bg-night-900 flex-shrink-0" style={{ color: cat.color }}>
                                            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    )
                                })()}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1" style={{ color: categoryFor(openConcept.name).color }}>
                                        {categoryFor(openConcept.name).label}
                                    </p>
                                    <h3 className="font-display text-base sm:text-xl font-bold text-cream mb-1 leading-tight">
                                        {openConcept.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                                        {loadingSubs ? (
                                            <span className="text-cream/40">Loading...</span>
                                        ) : subLessons.length > 0 ? (
                                            <span className="font-bold text-glow">+{totalSubLessonXP} XP total</span>
                                        ) : (
                                            <span className="text-cream/40">Legacy format</span>
                                        )}
                                        {openConcept.accuracy > 0 && (
                                            <>
                                                <span className="text-cream/40">•</span>
                                                <span className="text-cream/60">{openConcept.accuracy}% accuracy</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setOpenConcept(null)} className="rounded-lg p-1.5 sm:p-2 text-cream/50 hover:bg-night-700 hover:text-cream transition-colors flex-shrink-0">
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>

                        {/* Grammar note */}
                        <div className="rounded-xl border border-white/10 bg-night-900/60 p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-glow flex-shrink-0 mt-0.5" />
                                <p className="text-xs sm:text-sm leading-relaxed text-cream/80">
                                    {openConcept.grammarNote}
                                </p>
                            </div>
                        </div>

                        {/* Sub-lessons list */}
                        <div className="mb-4 sm:mb-6">
                            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mb-2 sm:mb-3">
                                {loadingSubs ? 'Loading...' : subLessons.length > 0 ? `${subLessons.length} part${subLessons.length !== 1 ? 's' : ''}` : 'Legacy lesson format'}
                            </p>
                            <div className="space-y-2">
                                {loadingSubs ? (
                                    <div className="flex items-center justify-center py-3 sm:py-4">
                                        <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-glow border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : subLessons.length > 0 ? (
                                    subLessons.map((sub, idx) => {
                                        const SubIcon = ICON_MAP[sub.icon] || BookOpenCheck
                                        const done = completedSubIds.includes(sub.id)
                                        const nextIdx = subLessons.findIndex(s => !completedSubIds.includes(s.id))
                                        const isNext = idx === nextIdx
                                        const locked = !done && !isNext
                                        return (
                                            <button
                                                key={sub.id}
                                                disabled={locked}
                                                onClick={() => router.push(`/learn/${openConcept.id}?mode=${preferredMode}&part=${sub.id}`)}
                                                className={`w-full flex items-center gap-2.5 sm:gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-all ${locked
                                                        ? 'border-white/5 bg-night-900/20 opacity-50 cursor-not-allowed'
                                                        : isNext
                                                            ? 'border-glow/40 bg-glow/5 hover:bg-glow/10'
                                                            : 'border-white/10 bg-night-900/40 hover:border-white/25 hover:bg-night-900'
                                                    }`}
                                            >
                                                <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${done ? 'bg-leaf/10 border-leaf/30' : 'bg-night-800 border-white/10'}`}>
                                                    {done ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-leaf" /> : <SubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cream/70" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-cream truncate">{sub.title}</p>
                                                    <p className="text-[11px] sm:text-xs text-cream/50">
                                                        {locked ? 'Finish previous part to unlock' : done ? 'Completed — tap to review' : isNext ? 'Up next' : ''}
                                                    </p>
                                                </div>
                                                <div className={`text-[11px] sm:text-xs font-bold flex-shrink-0 ${done ? 'text-leaf' : 'text-glow'}`}>
                                                    {locked ? <Lock className="h-3.5 w-3.5" /> : done ? '+0 XP' : `+${sub.xpReward} XP`}
                                                </div>
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-3 sm:py-4">
                                        <p className="text-[11px] sm:text-xs text-cream/40">This lesson uses the legacy format. Start it to begin learning.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode indicator */}
                        <div className="mb-3 sm:mb-4 flex items-center gap-2 text-[11px] sm:text-xs text-cream/50">
                            <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${currentMode.dot}`} />
                            <span>Continue in <span className="font-semibold text-cream/70">{currentMode.label}</span> Mode</span>
                        </div>

                        {/* Start/Review button */}
                        {(() => {
                            const available = (openConcept.modes || []).includes(preferredMode)
                            if (!available) {
                                return (
                                    <div className="rounded-xl border border-white/10 bg-night-900/40 p-3 sm:p-4 text-center">
                                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-cream/40 mx-auto mb-2" />
                                        <p className="text-xs sm:text-sm text-cream/60">Not available in {currentMode.label} mode yet.</p>
                                    </div>
                                )
                            }
                            const nextIdx = subLessons.findIndex(s => !completedSubIds.includes(s.id))
                            const href = nextIdx === -1
                                ? `/learn/${openConcept.id}?mode=${preferredMode}`
                                : `/learn/${openConcept.id}?mode=${preferredMode}&part=${subLessons[nextIdx].id}`
                            return (
                                <button
                                    onClick={() => router.push(href)}
                                    className={`w-full py-3 sm:py-4 rounded-xl ${currentMode.bg} ${currentMode.text} font-bold text-sm sm:text-base transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 ${currentMode.glow}`}
                                >
                                    {nextIdx === -1 ? 'Review Lesson' : `Start Part ${nextIdx + 1}`}
                                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            )
                        })()}
                    </div>
                </div>
            )}

            {/* ── Mode Picker Modal ─ */}
            {showModePicker && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowModePicker(false)}>
                    <div className="w-full max-w-sm rounded-t-3xl border border-white/10 bg-night-800 p-4 sm:p-6 shadow-glow-md sm:rounded-card sm:p-8" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 sm:mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="font-display text-base sm:text-xl font-bold text-cream">Switch Mode</h3>
                                <p className="text-[11px] sm:text-xs text-cream/50 mt-0.5">Your whole journey reshapes.</p>
                            </div>
                            <button onClick={() => setShowModePicker(false)} className="rounded-lg p-1 sm:p-1.5 text-cream/50 hover:bg-night-700 hover:text-cream transition-colors">
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>

                        <div className="space-y-2 sm:space-y-2.5">
                            {(Object.keys(MODE_META) as ModeId[]).map(id => {
                                const m = MODE_META[id]
                                const active = id === preferredMode
                                const MIcon = m.Icon
                                return (
                                    <button
                                        key={id}
                                        onClick={() => switchMode(id)}
                                        className={`flex w-full items-center gap-3 sm:gap-4 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${active ? 'border-white/25 bg-night-900' : 'border-white/10 bg-night-900/60 hover:border-white/25'}`}
                                        style={active ? { boxShadow: `0 0 24px ${m.borderColor}` } : undefined}
                                    >
                                        <span className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg ${m.bg} ${m.text}`}>
                                            <MIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </span>
                                        <span className="flex-1 text-left">
                                            <span className="block font-display text-xs sm:text-sm font-bold text-cream">{m.label}</span>
                                            <span className="block text-[11px] sm:text-xs text-cream/50">{m.desc}</span>
                                        </span>
                                        {active && <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-glow" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bonus Chest Modal ─ */}
            {chestOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-card border border-white/10 bg-night-800 p-5 sm:p-8 text-center shadow-glow-md">
                        <div className="mb-3 sm:mb-4 flex justify-center"><Firefly mood="proud" size={90} glow={glowColors} /></div>
                        <h3 className="font-display mb-2 text-xl sm:text-2xl font-bold text-cream">Bonus Chest!</h3>
                        <p className="mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed text-cream/70">{joke}</p>
                        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-glow/30 bg-glow/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-glow">+15 XP</div>
                        <button onClick={() => setChestOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-glow py-2.5 sm:py-3 font-bold text-night-900 text-sm sm:text-base transition-colors hover:bg-glow-bright">
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Keep going
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}