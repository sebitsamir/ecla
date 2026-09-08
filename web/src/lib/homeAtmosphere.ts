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
    overlay: 'linear-gradient(90deg,rgba(9,9,10,.76) 0%,rgba(9,9,10,.52) 38%,rgba(9,9,10,.08) 72%,rgba(9,9,10,.12) 100%)',
  },
  day: {
    period: 'day',
    greeting: 'Good afternoon',
    src: '/worlds/spanish-day-v1.webp',
    overlay: 'linear-gradient(90deg,rgba(9,9,10,.76) 0%,rgba(9,9,10,.50) 38%,rgba(9,9,10,.06) 72%,rgba(9,9,10,.10) 100%)',
  },
  evening: {
    period: 'evening',
    greeting: 'Good evening',
    src: '/worlds/spanish-evening-v2.webp',
    overlay: 'linear-gradient(90deg,rgba(9,9,10,.78) 0%,rgba(9,9,10,.58) 38%,rgba(9,9,10,.12) 72%,rgba(9,9,10,.22) 100%)',
  },
  night: {
    period: 'night',
    greeting: 'Welcome back',
    src: '/worlds/spanish-night-v1.webp',
    overlay: 'linear-gradient(90deg,rgba(9,9,10,.82) 0%,rgba(9,9,10,.60) 38%,rgba(9,9,10,.12) 72%,rgba(9,9,10,.20) 100%)',
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
