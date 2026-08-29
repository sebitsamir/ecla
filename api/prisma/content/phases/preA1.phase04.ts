import type { PhaseContent } from '../types'

/** PHASE 4 — Needs & Requests (Unit 4) */
export const phase04: PhaseContent = {
    phase: 4,
    stageName: 'Needs & Requests',
    unitMapping: 'Unit 4 — asking for what you need',
    competencies: [
        {
            code: 'PA1.NED.REQ.01',
            story: {
                beat: 'At a café counter — you need water.',
                dialogue: [
                    { speaker: 'barista', line: '¿Qué quieres?' },
                    { speaker: 'you', line: 'Quiero agua, por favor.' },
                ],
            },
            mission: {
                scenario: 'Request something politely in a new drink context.',
                successCriteria: ['uses quiero/necesito', 'includes por favor'],
                acceptableResponses: ['Quiero agua.', 'Necesito agua, por favor.', '¿Me das agua, por favor?'],
                unexpectedEvent: 'They offer the wrong drink.',
            },
            retention: { reuseIn: ['PA1.GAT.MIS.01'] },
        },
    ],
}
