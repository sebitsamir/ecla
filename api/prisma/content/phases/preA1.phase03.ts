import type { PhaseContent } from '../types'

/** PHASE 3 — Me (Unit 3) */
export const phase03: PhaseContent = {
    phase: 3,
    stageName: 'Me',
    unitMapping: 'Unit 3 — identity, origin, language',
    competencies: [
        {
            code: 'PA1.PER.NAM.01',
            story: {
                beat: 'Someone asks your name at a gathering.',
                dialogue: [
                    { speaker: 'host', line: '¿Cómo te llamas?' },
                    { speaker: 'you', line: 'Me llamo…' },
                ],
            },
            writing: [{ prompt: 'Write your name in Spanish.', accept: ['Me llamo'] }],
            retention: { reuseIn: ['PA1.RL.SOC.01'] },
        },
        {
            code: 'PA1.PER.ORG.01',
            immersion: {
                script: [
                    { speaker: 'A', line: '¿De dónde eres?' },
                    { speaker: 'B', line: 'Soy de…' },
                ],
            },
            drill: [
                { kind: 'recall', prompt: 'Say where you are from.', answer: 'Soy de España.', accept: ['Soy de'] },
            ],
        },
    ],
}
