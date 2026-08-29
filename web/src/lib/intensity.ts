/* Gamification intensity per mode.
   Data (XP, streaks, mastery) is ALWAYS tracked identically —
   this only scales the visual performance of gamification. */

export type IntensityLevel = 'full' | 'high' | 'minimal'

export const MODE_INTENSITY: Record<string, IntensityLevel> = {
    STORY: 'full',
    DRILL: 'high',
    IMMERSION: 'high',
    PROFESSIONAL: 'minimal',
    MISSION: 'minimal',
}

export function getIntensity(mode: string): IntensityLevel {
    return MODE_INTENSITY[mode] ?? 'high'
}

export function useIntensity(mode: string) {
    const level = getIntensity(mode)
    const minimal = level === 'minimal'
    return {
        level,
        minimal,
        showMascot: !minimal,
        largeMascot: level === 'full',
        playfulCopy: !minimal,
        glowEffects: !minimal,
        showGlowMeter: !minimal,
        showComboBanner: !minimal,
        fullCelebration: !minimal,
    }
}