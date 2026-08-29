import type { PhaseContent } from '../types'

/** PHASE 5 — Interaction & Repair (Unit 5) */
export const phase05: PhaseContent = {
    phase: 5,
    stageName: 'Interaction & Repair',
    unitMapping: 'Unit 5 — misunderstanding and repair',
    competencies: [
        {
            code: 'PA1.INT.REP.01',
            story: {
                beat: 'Someone speaks too quickly. You need them to slow down.',
                dialogue: [
                    { speaker: 'clerk', line: '¿Necesitas algo más?' },
                    { speaker: 'you', line: 'Más despacio, por favor.' },
                ],
            },
            mission: {
                scenario: 'NPC speaks quickly; learner repairs.',
                successCriteria: ['repair phrase used', 'interaction continues'],
                acceptableResponses: ['Más despacio, por favor.', '¿Puedes repetir?', 'No entiendo.'],
            },
            retention: { reuseIn: ['PA1.GAT.MIS.01'] },
        },
        {
            code: 'PA1.INT.UND.01',
            listening: [
                { utterance: 'No entiendo.', context: 'repair', action: 'Type what you hear.' },
            ],
            drill: [
                { kind: 'recall', prompt: 'Say you do not understand.', answer: 'No entiendo.', accept: ['No entiendo'] },
            ],
        },
    ],
}
