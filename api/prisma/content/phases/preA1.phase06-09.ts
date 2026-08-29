import type { PhaseContent } from '../types'

/** PHASE 6-9 — Directions, Shopping, Gateway prep (Units 6-9) */
export const phase06: PhaseContent = {
    phase: 6,
    stageName: 'Directions',
    unitMapping: 'Unit 6 — where things are',
    competencies: [
        {
            code: 'PA1.RL.DIR.01',
            story: {
                beat: 'You need the bathroom in an unfamiliar building.',
                dialogue: [
                    { speaker: 'staff', line: '¿En qué puedo ayudarte?' },
                    { speaker: 'you', line: '¿Dónde está el baño?' },
                ],
            },
            retention: { reuseIn: ['PA1.GAT.MIS.01'] },
        },
    ],
}

export const phase07: PhaseContent = {
    phase: 7,
    stageName: 'Shopping',
    unitMapping: 'Unit 7 — buying basics',
    competencies: [
        {
            code: 'PA1.SRV.PAY.01',
            mission: {
                scenario: 'Buy an item at a kiosk.',
                successCriteria: ['states item', 'handles price'],
                acceptableResponses: ['Quiero esto.', '¿Cuánto cuesta?', 'Dos euros, por favor.'],
            },
        },
    ],
}

export const phase08: PhaseContent = {
    phase: 8,
    stageName: 'Time & Plans',
    unitMapping: 'Unit 8 — simple scheduling',
    competencies: [
        {
            code: 'PA1.SRV.TIM.01',
            drill: [
                { kind: 'recall', prompt: 'Ask what time it is.', answer: '¿Qué hora es?', accept: ['¿Qué hora es?'] },
            ],
        },
    ],
}

export const phase09: PhaseContent = {
    phase: 9,
    stageName: 'Gateway Prep',
    unitMapping: 'Unit 9 — consolidation before gateway',
    competencies: [
        {
            code: 'PA1.GAT.MIS.01',
            mission: {
                scenario: 'Free objective: handle a simple unknown situation.',
                successCriteria: ['communicates meaning', 'repairs if needed'],
                acceptableResponses: ['Hola.', 'Perdón.', '¿Puedes repetir?', 'Gracias.'],
            },
        },
    ],
}
