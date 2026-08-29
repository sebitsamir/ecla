/**
 * ECLA cast — people, not mascots (Phase 9).
 * Recurring characters with stable roles so the world feels lived-in.
 */
import type { CharacterId } from '@/lib/sceneTypes'

export type CastMember = { name: string; role: string; color: string }

export const CAST: Record<CharacterId, CastMember> = {
    sofia:  { name: 'Sofía',  role: 'barista at the café',     color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    marta:  { name: 'Marta',  role: 'neighbor on the street',  color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    daniel: { name: 'Daniel', role: 'student you keep seeing', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    luis:   { name: 'Luis',   role: 'shopkeeper on the corner', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    ana:    { name: 'Ana',    role: 'receptionist downtown',   color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    you:    { name: 'You',    role: '',                        color: 'bg-white/10 text-cream border-white/20' },
}
