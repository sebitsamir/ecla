export type HomePeriod = 'morning' | 'day' | 'evening' | 'night'

export type HomeAtmosphere = {
  period: HomePeriod
  greeting: string
  src: string
  overlay: string
}

const ATMOSPHERES: Record<HomePeriod, HomeAtmosphere> = {
  morning: {
    period: 'morning',
    greeting: 'Good morning',
    src: '/worlds/spanish-morning-v1.webp',
    overlay: 'rgba(8,17,26,.28)',
  },
  day: {
    period: 'day',
    greeting: 'Good afternoon',
    src: '/worlds/spanish-day-v1.webp',
    overlay: 'rgba(8,17,26,.26)',
  },
  evening: {
    period: 'evening',
    greeting: 'Good evening',
    src: '/worlds/spanish-evening-v2.webp',
    overlay: 'rgba(8,17,26,.34)',
  },
  night: {
    period: 'night',
    greeting: 'Welcome back',
    src: '/worlds/spanish-night-v1.webp',
    overlay: 'rgba(8,17,26,.42)',
  },
}

export function homePeriodForHour(hour: number): HomePeriod {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return 'day'
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function homeAtmosphereFor(date: Date): HomeAtmosphere {
  return ATMOSPHERES[homePeriodForHour(date.getHours())]
}
