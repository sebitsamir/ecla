/**
 * ECLA cast — people, not mascots.
 * Colors are restrained tints: identity without cartoon energy.
 * `you` is the learner's own bubble style.
 */
import type { CharacterId } from '@/lib/sceneTypes'

export type CastMember = { name: string; role: string; color: string }

export const CAST: Record<CharacterId, CastMember> = {
    sofia:  { name: 'Silvina',  role: 'café worker', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    marta:  { name: 'Sofia',  role: 'neighbor',    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    daniel: { name: 'Lucas', role: 'student',     color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    luis:   { name: 'Luis',   role: 'taxi driver', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    ana:    { name: 'Ana',    role: 'colleague',   color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    you:    { name: 'You',    role: '',            color: 'bg-white/10 text-cream border-white/20' },
}