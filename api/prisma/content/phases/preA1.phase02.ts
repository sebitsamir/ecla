import type { PhaseContent } from '../types'

/** PHASE 2 — Social Basics (Unit 2) */
export const phase02: PhaseContent = {
    phase: 2,
    stageName: 'Social Basics',
    unitMapping: 'Unit 2 — greetings, courtesy, leave-taking',
    competencies: [
        {
            code: 'PA1.SOC.GRT.02',
            story: {
                beat: 'You pass someone in the hallway. A quick goodbye exchange.',
                dialogue: [
                    { speaker: 'neighbor', line: '¡Adiós!' },
                    { speaker: 'neighbor', line: '¡Hasta luego!' },
                ],
            },
            drill: [
                { kind: 'recall', prompt: 'Someone says goodbye. Respond.', answer: '¡Adiós!', accept: ['Adiós', 'Hasta luego'] },
            ],
            retention: { reuseIn: ['PA1.SOC.GRT.03'] },
        },
        {
            code: 'PA1.SOC.COU.01',
            story: {
                beat: 'You need to pass through a crowd politely.',
                dialogue: [
                    { speaker: 'stranger', line: 'Perdón.' },
                    { speaker: 'you', line: 'Disculpa, por favor.' },
                ],
            },
            mission: {
                scenario: 'Move through a busy space without bumping anyone.',
                successCriteria: ['uses polite phrase', 'meaning clear'],
                acceptableResponses: ['Perdón.', 'Disculpa.', 'Perdón, por favor.'],
            },
            retention: { reuseIn: ['PA1.SOC.RES.01'] },
        },
    ],
}
