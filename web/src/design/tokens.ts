export const eclaTokens = {
  color: { obsidian: '#09090A', ink: '#101012', carbon: '#17171A', slate: '#25252A', ivory: '#F4F0E8', stone: '#B8B2A8', ash: '#7E7A73', ember: '#FF7A3D', emberSoft: '#FFB26F', emberDeep: '#9E3D1C' },
  space: { 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 6: '1.5rem', 8: '2rem', 12: '3rem', 16: '4rem', 24: '6rem', 32: '8rem' },
  radius: { control: '0.875rem', surface: '1.125rem', experience: '1.75rem', round: '999px' },
  motion: { micro: '120ms', ui: '220ms', experience: '520ms', reflective: '1000ms', ease: 'cubic-bezier(0.22, 1, 0.36, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' },
  breakpoint: { mobile: 320, tablet: 768, laptop: 1024, desktop: 1280, wide: 1440 },
  z: { base: 0, raised: 10, header: 40, overlay: 50, toast: 60 },
} as const
export type MasteryState = 'exposed' | 'developing' | 'controlled' | 'transferred' | 'retained'
