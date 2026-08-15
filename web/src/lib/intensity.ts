/* Gamification intensity per mode.
   Data (XP, streaks, mastery) is ALWAYS tracked identically —
   this only scales the visual performance of gamification. */

export type IntensityLevel = 'full' | 'high' | 'minimal'

export const MODE_INTENSITY: Record<string, IntensityLevel> = {
    STORY: 'full',        // max Ecla presence, playful copy, animations
    DRILL: 'high',        // Ecla present but efficient
    IMMERSION: 'high',    // Ecla present, culture-flavored
    PROFESSIONAL: 'minimal', // Ecla mostly absent, clean stats only
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