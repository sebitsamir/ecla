export type JourneyUnitArtwork = { src: string; alt: string }

export const JOURNEY_UNIT_ARTWORK: Record<string, JourneyUnitArtwork> = {
    'Sound & Orientation': { src: '/worlds/journey/unit-sound-orientation.webp', alt: 'A tutor and learner practice Spanish vowel sounds with listening and direction cues.' },
    'First Contact': { src: '/worlds/journey/unit-first-contact.webp', alt: 'A learner and café barista share a warm first greeting.' },
    'Me': { src: '/worlds/journey/unit-me.webp', alt: 'A learner introduces herself to two new acquaintances.' },
    'My Immediate World': { src: '/worlds/journey/unit-immediate-world.webp', alt: 'A neighbor helps a learner recognize people and familiar things in a courtyard.' },
    'Basic Needs': { src: '/worlds/journey/unit-basic-needs.webp', alt: 'A learner politely asks a market vendor for bread and fruit.' },
    'Everyday Survival': { src: '/worlds/journey/unit-everyday-survival.webp', alt: 'A commuter helps a learner understand directions at a city transit stop.' },
    'Interaction & Repair': { src: '/worlds/journey/unit-interaction-repair.webp', alt: 'Two people use patient gestures to repair a misunderstanding.' },
    'Mini Real Life': { src: '/worlds/journey/unit-mini-real-life.webp', alt: 'A learner combines shopping, conversation, and navigation in a neighborhood.' },
    'Pre-A1 Gateway': { src: '/worlds/journey/unit-pre-a1-gateway.webp', alt: 'A learner shares a relaxed conversation with new friends after completing her journey.' },
}

const FALLBACK_ARTWORK = Object.values(JOURNEY_UNIT_ARTWORK)

export function journeyUnitArtwork(title: string, index: number) {
    return JOURNEY_UNIT_ARTWORK[title] ?? FALLBACK_ARTWORK[Math.abs(index) % FALLBACK_ARTWORK.length]
}
