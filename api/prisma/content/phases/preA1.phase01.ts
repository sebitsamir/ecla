import type { PhaseContent } from '../types'

/**
 * PHASE 1 — Sound & First Contact (reference implementation)
 * Demonstrates every override surface: story, drill, immersion,
 * mission, listening, pronunciation, culture, retention.
 */
export const phase01: PhaseContent = {
    phase: 1,
    stageName: 'Sound & First Contact',
    unitMapping: 'Stages 0-1 → Unit 1 (Sound & Orientation) + Unit 2 (First Contact)',
    proposedSeedAdditions: [],
    competencies: [
        {
            code: 'PA1.SND.LST.02',
            story: {
                beat: 'A teacher walks in and starts the first Spanish class. She points, speaks, and waits — the learner joins in with gestures and words.',
                dialogue: [
                    { speaker: 'teacher', line: 'Escucha.' },
                    { speaker: 'teacher', line: 'Mira.' },
                    { speaker: 'teacher', line: 'Repite.' },
                ],
            },
            drill: [
                { kind: 'recall', prompt: 'The teacher points at the board. What does she say?', answer: 'Mira.', accept: ['Mira'] },
                { kind: 'shadowing', prompt: 'Listen and repeat.', answer: 'Escucha.' },
            ],
            listening: [
                { utterance: 'Repite.', context: 'teacher instruction', action: 'Type the instruction you hear.' },
            ],
            pronunciation: [{ target: 'e', note: 'short, clean "e" — never "ay"' }],
            retention: { reuseIn: ['PA1.SOC.GRT.01', 'PA1.INT.UND.01'] },
        },
        {
            code: 'PA1.SOC.GRT.01',
            story: {
                beat: 'Two neighbors cross paths at the door. A short warm exchange — how they greet depends on the hour.',
                dialogue: [
                    { speaker: 'neighbor', line: '¡Hola!' },
                    { speaker: 'neighbor', line: 'Buenos días.' },
                ],
            },
            immersion: {
                script: [
                    { speaker: 'A', line: '¡Hola!' },
                    { speaker: 'B', line: '¡Hola! Buenos días.' },
                ],
                variationNote: 'Greetings vary by time of day and country — hear several, use any appropriate one.',
            },
            mission: {
                scenario: 'Someone approaches and greets you. Recognize the greeting and greet back appropriately.',
                successCriteria: ['responds with a greeting', 'response matches time/context when known'],
                acceptableResponses: ['Hola.', 'Buenos días.', 'Buenas tardes.', 'Buenas noches.', '¡Hola!'],
                unexpectedEvent: 'The partner greets with "¡Buenas!" (informal short form).',
            },
            culture: 'Hola works everywhere; buenos días / buenas tardes follow the clock, and "¡Buenas!" is a friendly shortcut in many regions.',
            retention: { reuseIn: ['PA1.RL.SOC.01', 'PA1.GAT.MIS.01'] },
        },
    ],
}