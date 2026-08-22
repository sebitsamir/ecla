import type { SceneSpec } from '@/lib/sceneTypes'

/** Reference scene: the "Hola" lesson as a lived situation. */
export const firstContactCafe: SceneSpec = {
    id: 'scene-pa1-cafe-first-contact',
    competencyCodes: ['PA1.SOC.GRT.01', 'PA1.SOC.INT.01', 'PA1.SOC.GRT.03', 'PA1.SOC.GRT.04', 'PA1.SOC.RES.01'],
    environment: 'cafe',
    setting: 'Madrid · A small café · 9:42',
    title: 'First contact',
    outcomes: [
        'recognize a greeting',
        'greet someone back',
        'say your name',
        "ask someone's name",
        'respond when meeting someone',
    ],
    beats: [
        { kind: 'action', stage: 'ENCOUNTER', text: 'The café door opens. Morning light. Someone behind the counter looks up and smiles.' },
        { kind: 'say', stage: 'ENCOUNTER', character: 'sofia', es: '¡Hola!' },
        {
            kind: 'choice', stage: 'UNDERSTAND', prompt: 'What do you think she said?',
            coach: 'Hola — a greeting. Notice how naturally she used it.',
            options: [
                { label: 'Hello — a greeting', correct: true },
                { label: 'Goodbye' },
                { label: 'Thank you' },
                { label: 'Water, please' },
            ]
        },
        { kind: 'listen', stage: 'NOTICE', character: 'sofia', es: 'Buenos días.' },
        {
            kind: 'speak', stage: 'PRODUCE', prompt: 'Greet her back.',
            expected: ['Hola', 'Buenos días', 'Hola, buenos días'], accept: ['ola', 'buenos dias'],
            hints: ['Think: greeting…', 'It starts with “Hola”.', 'Say: Hola.'],
            replyOnSuccess: '¡Hola! ¿Cómo te llamas?'
        },
        {
            kind: 'choice', stage: 'UNDERSTAND', prompt: 'She asked you something. What?',
            coach: '¿Cómo te llamas? = What’s your name?',
            options: [
                { label: 'Your name', correct: true },
                { label: 'How you are' },
                { label: 'Where you are from' },
                { label: 'What you want' },
            ]
        },
        {
            kind: 'speak', stage: 'INTERACT', prompt: 'Say your name.',
            expected: ['Me llamo', 'Soy'], open: true,
            hints: ['Me llamo …', 'Soy …'],
            replyOnSuccess: 'Mucho gusto. Yo soy Sofia.'
        },
        {
            kind: 'speak', stage: 'PRODUCE', prompt: 'Now say “Nice to meet you.”',
            expected: ['Mucho gusto', 'Encantado', 'Encantada'],
            hints: ['Mucho …', 'Mucho gusto.'],
            replyOnSuccess: '¿Un café?'
        },
        { kind: 'action', stage: 'TRANSFER', text: 'Sofia smiles and turns to the coffee machine. You just had your first conversation in Spanish.' },
        { kind: 'transfer-intro', stage: 'TRANSFER', text: 'Same ability. New situation.', setting: 'Your building · The hallway · Evening' },
        { kind: 'action', text: 'A neighbor holds the door for you. She looks at you.' },
        { kind: 'say', character: 'marta', es: '¡Hola! Buenas tardes.' },
        {
            kind: 'speak', stage: 'TRANSFER', prompt: 'Greet her and say your name. No hints this time.',
            expected: ['Hola', 'Buenas tardes', 'Me llamo', 'Soy'], open: true, hints: []
        },
        { kind: 'action', stage: 'RETAIN', text: 'She smiles. “¡Hasta luego!” The door closes. You did it — twice, with two different people.' },
    ],
}