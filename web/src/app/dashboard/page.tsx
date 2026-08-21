'use client'

/**
 * Dashboard Page: Main Learning Hub
 * 
 * This is the primary landing page after login, serving as the central hub for:
 * - Progress tracking (daily XP, streaks, glow tier)
 * - Learning mode selection and switching
 * - Next lesson preview and quick start
 * - Navigation to other sections (Review, Course Map, Chat)
 * - Cosmetic collection management (Firefly glow customization)
 * 
 * Key Features:
 * - Real-time progress visualization with animated XP ring
 * - 4-tier glow system (Dim → Warm → Radiant → Brilliant) based on consistency
 * - 4 learning modes that reshape the entire course experience
 * - Combo streak tracking for consecutive correct answers
 * - Wardrobe system for Firefly customization
 * - Unlock celebrations for new cosmetics
 * 
 * Architecture:
 * - Renders immediately with default values (no loading screen)
 * - Data fetched on mount via GET /api/v1/dashboard
 * - Refreshes on window focus and custom progress events
 * - Mode changes persist to backend and localStorage
 * - Cosmetic equipping persists to backend
 * 
 * Visual Design:
 * - Adaptive mascot size and effects based on learning mode intensity
 * - Dynamic greeting based on time of day
 * - Ambient background effects that change with mode
 * - Smooth animations for progress updates and celebrations
 * 
 * API Endpoints Used:
 * - GET /api/v1/dashboard: Fetches all progress data and next lesson
 * - POST /api/v1/user/mode: Updates preferred learning mode
 * - POST /api/v1/user/cosmetics/equip: Equips a Firefly cosmetic
 * 
 * Progress Sync:
 * - Listens to 'ecla:progress-updated' event (legacy code)
 * - Listens to 'luma:progress-updated' event (lesson page dispatches this)
 * - Refreshes on window focus (user returns from another tab)
 * - This ensures dashboard stays in sync with course progress
 * 
 * Error Handling:
 * - Shows retry button if API fetch fails (instead of false "finished everything")
 * - Never blocks UI on failure - user can still navigate
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import {
  BookOpen, Zap, Music, GraduationCap, ArrowRight,
  Flame, Target, Sparkles, RotateCcw, MessageCircle, Map,
  CheckCircle2, X, Lock, Palette, Moon, RefreshCw,
} from 'lucide-react'
import posthog from 'posthog-js'
import NightBackground from '@/components/NightBackground'
import ModeAmbience from '@/components/ModeAmbience'
import Firefly from '@/components/Firefly'
import { COSMETICS, CosmeticId, DEFAULT_GLOW } from '@/lib/cosmetics'
import { LogoMark } from '@/components/BrandLogo'
import { useIntensity } from '@/lib/intensity'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Learning mode metadata defining visual styling and behavior
 */
const MODE_META: Record<string, { id: string; label: string; desc: string; dot: string; bg: string; text: string; border: string; glow: string; Icon: any }> = {
  STORY: { id: 'STORY', label: 'Story', desc: 'Narrative', dot: 'bg-story', bg: 'bg-story', text: 'text-night-900', border: 'border-story', glow: 'shadow-[0_0_24px_rgba(255,180,90,0.35)]', Icon: BookOpen },
  DRILL: { id: 'DRILL', label: 'Drill', desc: 'Fast reps', dot: 'bg-drill', bg: 'bg-drill', text: 'text-night-900', border: 'border-drill', glow: 'shadow-[0_0_24px_rgba(77,216,230,0.35)]', Icon: Zap },
  IMMERSION: { id: 'IMMERSION', label: 'Immersion', desc: 'Culture', dot: 'bg-immersion', bg: 'bg-immersion', text: 'text-night-900', border: 'border-immersion', glow: 'shadow-[0_0_24px_rgba(185,140,240,0.35)]', Icon: Music },
  PROFESSIONAL: { id: 'PROFESSIONAL', label: 'Professional', desc: 'Workplace', dot: 'bg-pro', bg: 'bg-pro', text: 'text-night-900', border: 'border-pro', glow: 'shadow-[0_0_24px_rgba(127,166,255,0.35)]', Icon: GraduationCap },
}
type ModeId = keyof typeof MODE_META

/**
 * Glow tier definitions for Firefly customization
 */
const GLOW_TIERS: Record<string, { color: string; mood: 'idle' | 'proud' | 'radiant' }> = {
  Dim: { color: '#9a7a3d', mood: 'idle' },
  Warm: { color: '#FFC857', mood: 'idle' },
  Radiant: { color: '#FFE29A', mood: 'proud' },
  Brilliant: { color: '#FFF6CF', mood: 'radiant' },
}

/**
 * Generate time-based greeting message
 */
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export default function DashboardPage() {
  const router = useRouter()
  const { getToken } = useAuth()

  // ── Core Progress State ──
  const [dataReady, setDataReady] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [dailyXp, setDailyXp] = useState(0)
  const [dailyGoalXp, setDailyGoalXp] = useState(50)
  const [streakDays, setStreakDays] = useState(0)

  // ── Mode & Lesson State ──
  const [preferredMode, setPreferredMode] = useState<ModeId>('DRILL')
  const [nextLesson, setNextLesson] = useState<any>(null)
  const [comboStreak, setComboStreak] = useState(0)

  // ── Glow Tier State ──
  const [glowTier, setGlowTier] = useState('Dim')
  const [glowNext, setGlowNext] = useState(7)
  const [activeDays, setActiveDays] = useState(0)

  // ── UI State ──
  const [showModeSwitcher, setShowModeSwitcher] = useState(false)

  // ── Cosmetics State ──
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>(['gold'])
  const [equippedCosmetic, setEquippedCosmetic] = useState<CosmeticId>('gold')
  const [showWardrobe, setShowWardrobe] = useState(false)
  const [unlockCelebration, setUnlockCelebration] = useState<CosmeticId | null>(null)

  const glowColors = COSMETICS[equippedCosmetic]?.colors ?? DEFAULT_GLOW

  /**
   * Fetch dashboard data from backend API
   * 
   * On success: clears fetchFailed, populates state, sets dataReady
   * On failure: sets fetchFailed=true, shows retry UI instead of false empty state
   */
  const fetchDashboard = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/v1/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()

      setDailyXp(data.dailyXp || 0)
      setDailyGoalXp(data.dailyGoalXp || 50)
      setStreakDays(data.streakDays || 0)
      if (data.preferredMode && MODE_META[data.preferredMode]) {
        setPreferredMode(data.preferredMode as ModeId)
      }
      setNextLesson(data.nextLesson)
      setComboStreak(data.comboStreak || 0)
      setGlowTier(data.glowTier || 'Dim')
      setGlowNext(data.glowNext ?? 7)
      setActiveDays(data.activeDays || 0)
      setUnlockedCosmetics(data.unlockedCosmetics ?? ['gold'])

      if (data.equippedCosmetic && COSMETICS[data.equippedCosmetic as CosmeticId]) {
        setEquippedCosmetic(data.equippedCosmetic as CosmeticId)
      }

      if (data.newUnlocks?.length) {
        setTimeout(() => setUnlockCelebration(data.newUnlocks[0]), 600)
      }

      setFetchFailed(false)
      setDataReady(true)
    } catch (err) {
      console.error('[Dashboard] Fetch failed:', err)
      setFetchFailed(true)
      setDataReady(true)
    }
  }, [getToken])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    const handleUpdate = () => fetchDashboard()
    window.addEventListener('ecla:progress-updated', handleUpdate)
    window.addEventListener('luma:progress-updated', handleUpdate)
    window.addEventListener('focus', handleUpdate)
    return () => {
      window.removeEventListener('ecla:progress-updated', handleUpdate)
      window.removeEventListener('luma:progress-updated', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
    }
  }, [fetchDashboard])

  const switchMode = async (mode: ModeId) => {
    if (mode === preferredMode) { setShowModeSwitcher(false); return }

    const previousMode = preferredMode
    setPreferredMode(mode)
    setShowModeSwitcher(false)

    try {
      const token = await getToken()
      await fetch(`${API_URL}/api/v1/user/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      })
      posthog.capture('mode_switched', { new_mode: mode, source: 'dashboard' })
      fetchDashboard()
    } catch (e) {
      console.error(e)
      setPreferredMode(previousMode)
    }
  }

  const equipCosmetic = async (id: CosmeticId) => {
    const prev = equippedCosmetic
    setEquippedCosmetic(id)
    try {
      const token = await getToken()
      await fetch(`${API_URL}/api/v1/user/cosmetics/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cosmeticId: id }),
      })
      posthog.capture('cosmetic_equipped', { cosmetic_id: id })
    } catch (e) {
      console.error(e)
      setEquippedCosmetic(prev)
    }
  }

  const progressPercent = Math.min((dailyXp / dailyGoalXp) * 100, 100)
  const overflowXp = Math.max(0, dailyXp - dailyGoalXp)
  const goalSmashed = overflowXp > 0
  const mode = MODE_META[preferredMode]
  const ModeIcon = mode.Icon

  const intensity = useIntensity(preferredMode)
  const tier = GLOW_TIERS[glowTier] || GLOW_TIERS.Dim
  const tierProgress = glowTier === 'Brilliant' ? 100 : Math.round((activeDays / (activeDays + glowNext)) * 100)

  return (
    <main className="min-h-screen font-body">
      <style>{`
        @keyframes combo-pop { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .combo-pop { animation: combo-pop .5s ease-out; }
        @keyframes dome-glow { 0%,100% { opacity:.5; } 50% { opacity:.9; } }
        .dome-glow { animation: dome-glow 3s ease-in-out infinite; }
      `}</style>

      <NightBackground />
      <ModeAmbience mode={preferredMode} />

      {/* ── Header ─ */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
        <div className="mx-auto max-w-3xl px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark size={26} />
              <span className="font-display text-base sm:text-lg font-bold text-cream tracking-tight">Ecla</span>
            </Link>
            {!dataReady && (
              <span className="flex items-center gap-1 text-[10px] text-cream/40">
                <span className="h-1.5 w-1.5 rounded-full bg-glow animate-pulse" />
                Syncing
              </span>
            )}
          </div>
          <UserButton />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-5 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Hero Section ─ */}
        <section className="relative rounded-card border border-white/5 bg-night-800/60 p-4 sm:p-6 backdrop-blur-sm overflow-hidden shadow-glow-sm">
          {intensity.showMascot && (
            <div className="pointer-events-none absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 h-40 w-40 sm:h-48 sm:w-48 rounded-full dome-glow" style={{ background: `radial-gradient(circle, ${glowColors.halo}40 0%, transparent 70%)`, filter: 'blur(10px)' }} />
          )}

          {intensity.playfulCopy ? (
            <div className="relative flex flex-col items-center text-center mb-4 sm:mb-6">
              <div className="mb-2 sm:mb-3 cursor-pointer" onClick={() => setShowWardrobe(true)} title="Glow Collection">
                <Firefly mood={tier.mood} size={intensity.largeMascot ? 110 : 80} glow={glowColors} />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-cream mb-1 flex items-center justify-center gap-2">
                {getGreeting()} <Moon className="h-5 w-5 text-glow" />
              </h1>
              <p className="text-xs sm:text-sm text-cream/50">Ecla missed you.</p>
            </div>
          ) : (
            <div className="relative mb-4 sm:mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-cream mb-1">Welcome back.</h1>
                <p className="text-xs sm:text-sm text-cream/50">Ready when you are.</p>
              </div>
              <button
                onClick={() => setShowWardrobe(true)}
                title="Glow Collection"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-night-900/60 hover:border-white/25 transition-all"
              >
                <span className="h-3 w-3 rounded-full" style={{ background: glowColors.halo, boxShadow: `0 0 10px ${glowColors.halo}80` }} />
              </button>
            </div>
          )}

          {intensity.showComboBanner && comboStreak >= 3 && (
            <div className="combo-pop mb-3 sm:mb-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-glow/40 bg-glow/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-glow">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{comboStreak}-answer streak — bonus XP!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-xl border border-white/5 bg-night-900/60 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Flame className={`h-4 w-4 sm:h-5 sm:w-5 ${intensity.glowEffects ? 'text-glow' : 'text-cream/50'}`} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40">Day Streak</span>
              </div>
              <p className={`font-display text-2xl sm:text-3xl font-black ${intensity.glowEffects ? 'text-glow' : 'text-cream'}`}>{streakDays}</p>
              <p className="text-[11px] sm:text-xs text-cream/50">{streakDays === 1 ? 'day running' : 'days running'}</p>
            </div>

            <div className="rounded-xl border border-white/5 bg-night-900/60 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: intensity.glowEffects ? tier.color : '#9aa3b5' }} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40">Glow</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-black" style={{ color: intensity.glowEffects ? tier.color : '#F4F1EA' }}>{glowTier}</p>
              <p className="text-[11px] sm:text-xs text-cream/50">
                {glowTier === 'Brilliant' ? (
                  <span className="flex items-center gap-1">
                    Max tier {intensity.glowEffects && <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline" />}
                  </span>
                ) : (
                  `${glowNext} days to next`
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ── Daily XP Goal Ring ─ */}
        <section className="rounded-card border border-white/5 bg-night-800/60 p-4 sm:p-6 backdrop-blur-sm shadow-glow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mb-1">Today's Goal</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <p className="font-display text-xl sm:text-2xl font-bold text-cream">
                  {goalSmashed ? dailyGoalXp : dailyXp} <span className="text-cream/40 text-base sm:text-lg">/ {dailyGoalXp} XP</span>
                </p>
                {goalSmashed && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-glow/40 bg-glow/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-glow">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +{overflowXp} XP
                  </span>
                )}
              </div>
            </div>

            <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(244,241,234,0.1)" strokeWidth="8" fill="transparent" />
                {goalSmashed && (
                  <circle cx="50" cy="50" r="48" stroke="#FFC857" strokeWidth="2" fill="transparent" opacity="0.7" style={{ filter: 'drop-shadow(0 0 6px #FFC857)' }} />
                )}
                <circle
                  cx="50" cy="50" r="42"
                  stroke={goalSmashed ? '#FFC857' : tier.color} strokeWidth="8" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${goalSmashed ? '#FFC857' : tier.color})`, transition: 'stroke-dashoffset .6s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {goalSmashed ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-glow" /> : <Target className="h-4 w-4 sm:h-5 sm:w-5 text-cream/70" />}
              </div>
            </div>
          </div>

          {goalSmashed ? (
            <p className="text-xs sm:text-sm font-semibold text-glow flex items-center gap-1.5 sm:gap-2"><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Goal smashed! Ecla is radiant!</p>
          ) : progressPercent >= 100 ? (
            <p className="text-xs sm:text-sm font-semibold text-leaf flex items-center gap-1.5 sm:gap-2"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Daily goal complete!</p>
          ) : (
            <p className="text-xs sm:text-sm text-cream/50">{dailyGoalXp - dailyXp} XP left today.</p>
          )}
        </section>

        {/* ── Mode Switcher ─ */}
        <section className="rounded-card border border-white/5 bg-night-800/60 p-4 sm:p-6 backdrop-blur-sm shadow-glow-sm">
          <div className="mb-3 sm:mb-4">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40">Learning Mode</p>
            <p className="text-xs sm:text-sm text-cream/60 mt-0.5 sm:mt-1">{mode.desc} · tap to switch</p>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(MODE_META) as ModeId[]).map(id => {
              const m = MODE_META[id]
              const MIcon = m.Icon
              const active = id === preferredMode
              return (
                <button
                  key={id}
                  onClick={() => switchMode(id)}
                  className={`flex flex-shrink-0 items-center gap-2 sm:gap-2.5 rounded-full border px-3 sm:px-4 py-2 sm:py-2.5 transition-all ${active
                    ? `${m.border} ${m.bg}/15 ${m.glow}`
                    : 'border-white/10 bg-night-900/60 hover:border-white/20 hover:bg-night-900'
                    }`}
                >
                  <MIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${active ? m.text : 'text-cream/70'}`} />
                  <span className={`text-xs sm:text-sm font-semibold ${active ? m.text : 'text-cream/70'}`}>{m.label}</span>
                  <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${m.dot}`} />
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Next Lesson Preview ─ 
          Shows retry state on fetch failure instead of false "finished everything"
        */}
        <section className="rounded-card border border-white/5 bg-night-800/60 p-4 sm:p-6 backdrop-blur-sm shadow-glow-sm">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mb-3 sm:mb-4">Continue Learning</p>
          {nextLesson ? (
            <div className="relative">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative flex-shrink-0">
                  {intensity.showMascot && (
                    <div className="pointer-events-none absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 z-10">
                      <Firefly mood="idle" size={44} glow={glowColors} />
                    </div>
                  )}
                  <div className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border-2 ${mode.border} ${mode.bg}/15 ${mode.glow}`}>
                    <ModeIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${mode.text}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                  <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${mode.text} mb-0.5 sm:mb-1`}>{mode.label} Mode · +{nextLesson.xpReward} XP</p>
                  <h3 className="font-display text-base sm:text-lg font-bold text-cream truncate">{nextLesson.conceptName}</h3>
                  {nextLesson.variant?.storyBeat && <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-cream/50 italic truncate">&ldquo;{nextLesson.variant.storyBeat}&rdquo;</p>}
                  {nextLesson.variant?.culturalRef && <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-cream/50 italic truncate">&ldquo;{nextLesson.variant.culturalRef}&rdquo;</p>}
                  {nextLesson.variant?.formalPhrase && <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-cream/50 italic truncate">&ldquo;{nextLesson.variant.formalPhrase}&rdquo;</p>}
                </div>
              </div>

              <button
                onClick={() => router.push(`/learn/${nextLesson.conceptId}?mode=${preferredMode}`)}
                className={`mt-4 sm:mt-5 w-full py-3 sm:py-3.5 rounded-xl ${mode.bg} ${mode.text} font-display font-bold text-sm sm:text-base transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 ${mode.glow}`}
              >
                Start Lesson <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : fetchFailed ? (
            /* ── Retry state: shows when API fails instead of false "finished" ─ */
            <div className="py-6 sm:py-8 text-center">
              <Firefly mood="dim" size={64} className="mx-auto mb-3" glow={glowColors} />
              <p className="text-xs sm:text-sm text-cream/60 mb-4">Couldn't load your progress.</p>
              <button
                onClick={fetchDashboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-glow font-bold text-night-900 text-sm hover:bg-glow-bright transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          ) : (
            /* ── Genuine empty state: user actually finished everything ─ */
            <div className="py-6 sm:py-8 text-center">
              {intensity.showMascot && <Firefly mood="proud" size={64} className="mx-auto mb-3" glow={glowColors} />}
              <p className="text-xs sm:text-sm text-cream/60">You've finished everything!</p>
            </div>
          )}
        </section>

        {/* ── Quick Actions Grid ─ */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <Link href="/review" className="group rounded-card border border-white/5 bg-night-800/60 p-3 sm:p-5 backdrop-blur-sm hover:border-immersion/50 hover:bg-night-800 transition-all">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-immersion/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-immersion/20 transition-colors">
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-immersion" />
            </div>
            <p className="font-display text-sm sm:text-base font-bold text-cream">Review</p>
            <p className="text-[11px] sm:text-xs text-cream/50 mt-0.5">Spaced repetition</p>
          </Link>

          <Link href="/course" className="group rounded-card border border-white/5 bg-night-800/60 p-3 sm:p-5 backdrop-blur-sm hover:border-glow/50 hover:bg-night-800 transition-all">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-glow/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-glow/20 transition-colors">
              <Map className="h-4 w-4 sm:h-5 sm:w-5 text-glow" />
            </div>
            <p className="font-display text-sm sm:text-base font-bold text-cream">The Path</p>
            <p className="text-[11px] sm:text-xs text-cream/50 mt-0.5">Full course map</p>
          </Link>

          <Link href="/chat" className="group rounded-card border border-white/5 bg-night-800/60 p-3 sm:p-5 backdrop-blur-sm hover:border-pro/50 hover:bg-night-800 transition-all col-span-2 sm:col-span-1">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-pro/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-pro/20 transition-colors">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-pro" />
            </div>
            <p className="font-display text-sm sm:text-base font-bold text-cream">AI Tutor</p>
            <p className="text-[11px] sm:text-xs text-cream/50 mt-0.5">Chat in Spanish</p>
          </Link>
        </section>

        {/* ── Glow Meter Progress ─ */}
        {intensity.showGlowMeter && (
          <section className="rounded-card border border-white/5 bg-night-800/60 p-4 sm:p-6 backdrop-blur-sm shadow-glow-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5 sm:mb-1">Ecla's Glow</p>
                <p className="font-display text-base sm:text-lg font-bold text-cream truncate">
                  <span style={{ color: tier.color }}>{glowTier}</span>
                  {glowTier !== 'Brilliant' && <span className="text-cream/40 text-sm sm:text-base"> · {activeDays}/30</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowWardrobe(true)}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/10 bg-night-900/60 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-cream/70 hover:text-cream hover:border-white/25 transition-all"
                >
                  <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: glowColors.halo }} />
                  <span className="hidden sm:inline">Collection</span> · {unlockedCosmetics.length}/{Object.keys(COSMETICS).length}
                </button>

                <div className="flex gap-0.5 sm:gap-1">
                  {['Dim', 'Warm', 'Radiant', 'Brilliant'].map(t => (
                    <div
                      key={t}
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${GLOW_TIERS[t].color === tier.color ? '' : 'opacity-30'}`}
                      style={{ background: GLOW_TIERS[t].color }}
                      title={t}
                    />
                  ))}
                </div>
              </div>
            </div>

            {glowTier !== 'Brilliant' && (
              <div className="relative h-1.5 sm:h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${tierProgress}%`, background: `linear-gradient(90deg, ${tier.color}, #FFF6CF)` }} />
              </div>
            )}

            <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-cream/50">
              {glowTier === 'Brilliant'
                ? 'Maximum tier reached.'
                : `${glowNext} more day${glowNext === 1 ? '' : 's'} to ${getTierAfter(glowTier)}.`}
            </p>
          </section>
        )}
      </div>

      {/* ── Wardrobe Modal ─ */}
      {showWardrobe && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowWardrobe(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-night-800 p-4 sm:p-6 shadow-glow-md sm:rounded-card sm:p-8" onClick={e => e.stopPropagation()}>
            <div className="mb-4 sm:mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-cream">Glow Collection</h3>
                <p className="text-[11px] sm:text-xs text-cream/50 mt-0.5">Ecla's light, your style.</p>
              </div>
              <button onClick={() => setShowWardrobe(false)} className="rounded-lg p-1.5 text-cream/50 hover:bg-night-700 hover:text-cream"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {(Object.values(COSMETICS)).map(c => {
                const unlocked = unlockedCosmetics.includes(c.id)
                const equipped = equippedCosmetic === c.id
                return (
                  <button
                    key={c.id}
                    disabled={!unlocked}
                    onClick={() => { equipCosmetic(c.id); setShowWardrobe(false); }}
                    className={`relative rounded-lg sm:rounded-xl border p-3 sm:p-4 text-left transition-all ${equipped ? 'border-white/30 bg-night-900' : unlocked ? 'border-white/10 bg-night-900/60 hover:border-white/25' : 'border-white/5 bg-night-900/30 opacity-60'
                      }`}
                  >
                    <div
                      className="mb-2 sm:mb-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 40% 35%, ${c.colors.core} 0%, ${c.colors.mid} 50%, ${c.colors.deep} 100%)`,
                        boxShadow: unlocked ? `0 0 18px ${c.colors.halo}66` : 'none',
                        filter: unlocked ? 'none' : 'grayscale(0.8) brightness(0.5)',
                      }}
                    />
                    <p className="font-display text-xs sm:text-sm font-bold text-cream">{c.name}</p>

                    {equipped ? (
                      <p className="text-[10px] sm:text-xs font-semibold text-glow mt-0.5">Equipped</p>
                    ) : unlocked ? (
                      <p className="text-[10px] sm:text-xs text-cream/50 mt-0.5">Tap to equip</p>
                    ) : (
                      <p className="text-[10px] sm:text-xs text-cream/40 mt-0.5 flex items-center gap-1"><Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {c.unlockText}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Unlock Celebration Modal ─ */}
      {unlockCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-card border border-white/10 bg-night-800 p-5 sm:p-8 text-center shadow-glow-md">
            <div className="mb-3 sm:mb-4 flex justify-center">
              <Firefly mood="proud" size={100} glow={COSMETICS[unlockCelebration].colors} />
            </div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mb-1">New Glow Unlocked</p>
            <h3 className="font-display text-xl sm:text-2xl font-bold mb-2" style={{ color: COSMETICS[unlockCelebration].colors.halo }}>
              {COSMETICS[unlockCelebration].name}
            </h3>
            <p className="text-xs sm:text-sm text-cream/60 mb-4 sm:mb-6">{COSMETICS[unlockCelebration].desc}</p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => { equipCosmetic(unlockCelebration); setUnlockCelebration(null) }}
                className="flex-1 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-bold text-night-900 transition-all hover:brightness-110"
                style={{ background: COSMETICS[unlockCelebration].colors.halo }}
              >
                Equip Now
              </button>
              <button onClick={() => setUnlockCelebration(null)} className="flex-1 rounded-xl border border-white/10 bg-night-900/60 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-cream/70 hover:text-cream">
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function getTierAfter(tier: string): string {
  const order = ['Dim', 'Warm', 'Radiant', 'Brilliant']
  const idx = order.indexOf(tier)
  return order[Math.min(idx + 1, order.length - 1)]
}