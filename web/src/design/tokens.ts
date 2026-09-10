export const eclaTokens = {
  color: { obsidian: '#08111A', ink: '#0F1720', carbon: '#17212B', slate: '#263440', ivory: '#F7F2E8', stone: '#AAB3BD', ash: '#8E99A6', ember: '#E6A23C', emberSoft: '#F0BF67', emberDeep: '#B9751D' },
  space: { 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 6: '1.5rem', 8: '2rem', 12: '3rem', 16: '4rem', 24: '6rem', 32: '8rem' },
  radius: { control: '0.875rem', surface: '1.125rem', experience: '1.75rem', round: '999px' },
  motion: { micro: '120ms', ui: '220ms', experience: '520ms', reflective: '1000ms', ease: 'cubic-bezier(0.22, 1, 0.36, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' },
  breakpoint: { mobile: 320, tablet: 768, laptop: 1024, desktop: 1280, wide: 1440 },
  z: { base: 0, raised: 10, header: 40, overlay: 50, toast: 60 },
} as const
export type MasteryState = 'exposed' | 'developing' | 'controlled' | 'transferred' | 'retained'
