/**
 * unitDirections — Phase 7 scene matrix: authored creative layer.
 *
 * The curriculum owns language truth; this table owns WORLD direction:
 * which environment, which recurring people, which time of day a domain
 * of competencies lives in. Deterministic and stable so characters recur
 * (Phase 9) and the same world evolves with the learner (Phase 32).
 *
 * Every Pre-A1 competency code resolves to exactly one direction.
 */
import type { CharacterId, Environment } from '@/lib/sceneTypes'

export type UnitDirection = {
    key: string
    match: RegExp
    environment: Environment
    transferSetting: string
    cast: CharacterId[]
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    mood: 'warm' | 'calm' | 'busy' | 'quiet'
    sceneNoun: string
    unexpected: string
}

export const DIRECTIONS: UnitDirection[] = [
    {
        key: 'identity',
        match: /(^|\.)(ID|NAME|INTRO)/,
        environment: 'cafe',
        transferSetting: 'The terrace next door',
        cast: ['sofia'],
        timeOfDay: 'morning',
        mood: 'warm',
        sceneNoun: 'a first hello',
        unexpected: 'They ask your name again, a little faster.',
    },
    {
        key: 'social',
        match: /(SOC|GRT|LEAVE|THANK)/,
        environment: 'cafe',
        transferSetting: 'The shop on the corner',
        cast: ['sofia', 'marta'],
        timeOfDay: 'evening',
        mood: 'busy',
        sceneNoun: 'a warm exchange',
        unexpected: 'A second person joins the goodbye.',
    },
    {
        key: 'listening',
        match: /(SND|LST|HEAR)/,
        environment: 'street',
        transferSetting: 'A different street, a different voice',
        cast: ['daniel'],
        timeOfDay: 'afternoon',
        mood: 'calm',
        sceneNoun: 'a voice in the street',
        unexpected: 'The voice speeds up for one phrase.',
    },
    {
        key: 'requests',
        match: /(NEED|ASK|ORD|WANT)/,
        environment: 'cafe',
        transferSetting: 'The shop next door',
        cast: ['sofia', 'luis'],
        timeOfDay: 'morning',
        mood: 'busy',
        sceneNoun: 'asking for what you need',
        unexpected: 'They mishear the item — one detail changes.',
    },
    {
        key: 'repair',
        match: /(REP|UND|INT)/,
        environment: 'street',
        transferSetting: 'A new person, faster speech',
        cast: ['marta', 'luis'],
        timeOfDay: 'afternoon',
        mood: 'busy',
        sceneNoun: 'when you don\u2019t understand',
        unexpected: 'They answer with a phrase you never practiced.',
    },
    {
        key: 'places',
        match: /(LOC|DIR|WHERE)/,
        environment: 'street',
        transferSetting: 'The bus station',
        cast: ['daniel', 'ana'],
        timeOfDay: 'morning',
        mood: 'calm',
        sceneNoun: 'finding a place',
        unexpected: 'The directions change one landmark.',
    },
    {
        key: 'default',
        match: /./,
        environment: 'cafe',
        transferSetting: 'The street outside',
        cast: ['sofia'],
        timeOfDay: 'morning',
        mood: 'warm',
        sceneNoun: 'a small moment',
        unexpected: 'One detail changes; adapt or repair.',
    },
]

export function directionFor(code: string): UnitDirection {
    const c = String(code ?? '').toUpperCase()
    return DIRECTIONS.find(d => d.match.test(c)) ?? DIRECTIONS[DIRECTIONS.length - 1]
}