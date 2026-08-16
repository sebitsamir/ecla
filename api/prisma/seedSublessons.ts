import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const course = await prisma.course.findFirst({
        where: { isPublished: true },
        include: { units: { include: { concepts: { orderBy: { orderIndex: 'asc' } } } } },
    })
    if (!course) throw new Error('No published course')
    const concept = course.units[0]?.concepts[0]
    if (!concept) throw new Error('No concepts found')

    const subLessons = [
        // ────────────────────────────────────────────────
        // 1. UNDERSTAND — the pattern, not just the rule
        // ────────────────────────────────────────────────
        {
            title: 'Understand -ER / -IR verbs',
            icon: 'book-open',
            xpReward: 10,
            teach: [
                {
                    type: 'explain',
                    text: 'Spanish verbs come in 3 families by their ending: -AR, -ER, -IR. -ER and -IR share almost the same endings in the present tense — learn them together and you get two families for the price of one.',
                },
                {
                    type: 'explain',
                    text: 'Drop the -er/-ir, then add: -o (I), -es (you), -e (he/she), -emos/-imos (we), -en (they). Only "we" is different between the two families.',
                },
                { type: 'example', es: 'Valentina come pan cada mañana.', en: 'Valentina eats bread every morning.' },
                { type: 'example', es: 'Ella vive en Madrid con su hermana.', en: 'She lives in Madrid with her sister.' },
                { type: 'example', es: 'Nosotros comemos juntos los domingos.', en: 'We eat together on Sundays.' },
                {
                    type: 'vocab',
                    items: [
                        { word: 'comer', translation: 'to eat' },
                        { word: 'beber', translation: 'to drink' },
                        { word: 'vivir', translation: 'to live' },
                        { word: 'escribir', translation: 'to write' },
                        { word: 'leer', translation: 'to read' },
                    ],
                },
                { type: 'tip', text: 'Say "comemos" and "vivimos" out loud back to back. Hear the only real difference: -emos vs -imos.' },
            ],
            exercises: [
                {
                    type: 'listen_choose',
                    audio: 'Valentina come pan cada mañana.',
                    options: ['Valentina eats bread every morning.', 'Valentina drinks water every morning.', 'Valentina lives in Madrid.'],
                    answer: 'Valentina eats bread every morning.',
                    whyExplanation: '"Come" is 3rd person of "comer" (to eat) — "pan" (bread) confirms it, not a drink or a location.',
                },
                {
                    type: 'mcq',
                    prompt: 'Ella ___ en Sevilla. (vivir)',
                    options: ['vive', 'vives', 'vivo', 'viven'],
                    answer: 'vive',
                    whyExplanation: '"Ella" (she) takes the -e ending: vive. "Viven" would be for "ellos/ellas" (they).',
                },
                {
                    type: 'fill_blank',
                    prompt: 'Nosotros ___ (comer) juntos los domingos.',
                    answer: 'comemos',
                    whyExplanation: '-ER verbs use -emos for "we" — comer → comemos.',
                },
                {
                    type: 'fill_blank',
                    prompt: 'Nosotros ___ (vivir) en la misma ciudad.',
                    answer: 'vivimos',
                    whyExplanation: '-IR verbs use -imos for "we" — vivir → vivimos. This is the ONE place -ER and -IR actually differ.',
                },
                {
                    type: 'listen_type',
                    audio: 'Yo bebo agua todos los días.',
                    answer: 'Yo bebo agua todos los días.',
                },
                {
                    type: 'match',
                    pairs: [
                        { a: 'comer', b: 'to eat' },
                        { a: 'beber', b: 'to drink' },
                        { a: 'vivir', b: 'to live' },
                        { a: 'leer', b: 'to read' },
                    ],
                },
            ],
            realLife: {
                prompt: 'Say three true sentences about yourself out loud right now: "Como…", "Bebo…", "Vivo en…".',
                chatSeed: 'Quiero practicar verbos -ER y -IR en presente hablando de mi día.',
            },
        },

        // ────────────────────────────────────────────────
        // 2. HEAR IT — ear training before more grammar
        // ────────────────────────────────────────────────
        {
            title: 'Hear the endings',
            icon: 'ear',
            xpReward: 10,
            teach: [
                {
                    type: 'explain',
                    text: 'In fast speech, the verb ending is often the ONLY clue to who is doing the action — Spanish frequently drops the subject pronoun (yo, tú, él). Train your ear on endings and you can follow real conversation.',
                },
                { type: 'example', es: 'Como, comes, come, comemos, comen.', en: 'I eat, you eat, he/she eats, we eat, they eat.' },
                { type: 'example', es: '¿Qué bebes? — Bebo café.', en: '"What do you drink?" — "I drink coffee."' },
                { type: 'tip', text: 'Tap 🔊 on every example below at least twice before answering. Your ear learns faster than your eyes here.' },
            ],
            exercises: [
                {
                    type: 'listen_choose',
                    audio: 'Ellos viven aquí.',
                    options: ['They live here.', 'We live here.', 'I live here.'],
                    answer: 'They live here.',
                    whyExplanation: '"Viven" ends in -en, the "ellos/ellas" (they) ending.',
                },
                {
                    type: 'listen_choose',
                    audio: '¿Qué bebes?',
                    options: ['What do you drink?', 'What do you eat?', 'Where do you live?'],
                    answer: 'What do you drink?',
                    whyExplanation: '"Bebes" comes from "beber" (to drink), -es ending = "tú" (you).',
                },
                {
                    type: 'listen_type',
                    audio: 'Ella escribe una carta.',
                    answer: 'Ella escribe una carta.',
                },
                {
                    type: 'mcq',
                    prompt: '"They eat" in Spanish is…',
                    options: ['comen', 'comes', 'come', 'como'],
                    answer: 'comen',
                    whyExplanation: '-en is the "they" ending for both -ER and -IR verbs.',
                },
                {
                    type: 'listen_choose',
                    audio: 'Leemos el periódico por la mañana.',
                    options: ['We read the newspaper in the morning.', 'I read the newspaper in the morning.', 'They read the newspaper in the morning.'],
                    answer: 'We read the newspaper in the morning.',
                    whyExplanation: '"Leemos" — -emos ending confirms "nosotros" (we).',
                },
            ],
            realLife: {
                prompt: 'Close your eyes and say the full -ER ending set out loud, no notes: -o, -es, -e, -emos, -en.',
                chatSeed: 'Dime frases cortas con verbos -ER y -IR para practicar el oído.',
            },
        },

        // ────────────────────────────────────────────────
        // 3. THE TRAPS — irregular yo-forms (the real gap)
        // ────────────────────────────────────────────────
        {
            title: 'Watch out: irregular "yo" forms',
            icon: 'alert-triangle',
            xpReward: 15,
            teach: [
                {
                    type: 'explain',
                    text: 'A handful of everyday -ER/-IR verbs break the pattern ONLY in the "yo" (I) form. You will hear and need these constantly, so learn them as exceptions now instead of getting confused later.',
                },
                { type: 'example', es: 'Tengo un hermano. (not "teno")', en: 'I have a brother.' },
                { type: 'example', es: 'Salgo de casa a las ocho.', en: 'I leave home at eight.' },
                { type: 'example', es: 'Hago la tarea por la noche.', en: 'I do homework at night.' },
                {
                    type: 'vocab',
                    items: [
                        { word: 'tengo (tener)', translation: 'I have' },
                        { word: 'salgo (salir)', translation: 'I leave / go out' },
                        { word: 'hago (hacer)', translation: 'I do / make' },
                        { word: 'pongo (poner)', translation: 'I put' },
                    ],
                },
                { type: 'tip', text: 'Notice the pattern within the exception: tengo, salgo, hago, pongo all end in -go. Every other form (tú, él, nosotros...) follows the regular pattern you already know.' },
            ],
            exercises: [
                {
                    type: 'mcq',
                    prompt: 'Yo ___ un perro y un gato. (tener)',
                    options: ['tengo', 'teno', 'tiene', 'tienes'],
                    answer: 'tengo',
                    whyExplanation: '"Tener" is irregular only in "yo": tengo. Everywhere else it follows the normal -ER pattern with a small vowel change (tienes, tiene).',
                },
                {
                    type: 'fill_blank',
                    prompt: 'Yo ___ (salir) de casa muy temprano.',
                    answer: 'salgo',
                    whyExplanation: 'Salir → salgo in "yo" only. Tú sales, él sale, follows the regular pattern.',
                },
                {
                    type: 'listen_choose',
                    audio: 'Hago la tarea antes de cenar.',
                    options: ['I do homework before dinner.', 'You do homework before dinner.', 'She does homework before dinner.'],
                    answer: 'I do homework before dinner.',
                    whyExplanation: '"Hago" is unmistakably "yo" (I) — it is the exception form, so it only ever means "I do/make."',
                },
                {
                    type: 'match',
                    pairs: [
                        { a: 'tengo', b: 'I have' },
                        { a: 'salgo', b: 'I leave' },
                        { a: 'hago', b: 'I do/make' },
                        { a: 'pongo', b: 'I put' },
                    ],
                },
            ],
            realLife: {
                prompt: 'Say out loud: what you have (tengo…), what time you leave home (salgo a las…), and one thing you do every day (hago…).',
                chatSeed: 'Quiero practicar los verbos irregulares tengo, salgo y hago hablando de mi rutina.',
            },
        },

        // ────────────────────────────────────────────────
        // 4. USE IT — real sentences, real conversation
        // ────────────────────────────────────────────────
        {
            title: 'Use it: talk about your day',
            icon: 'message-circle',
            xpReward: 10,
            teach: [
                {
                    type: 'explain',
                    text: 'Real sentences follow: subject (optional) + verb + detail. You now have enough regular AND irregular verbs to describe a full normal day.',
                },
                { type: 'example', es: 'Vivo con mi familia y tengo dos hermanos.', en: 'I live with my family and I have two siblings.' },
                { type: 'example', es: 'Salgo a las ocho, como a la una, y escribo mensajes todo el día.', en: 'I leave at eight, eat at one, and write messages all day.' },
            ],
            exercises: [
                {
                    type: 'translate',
                    prompt: 'I live in Madrid and I have a dog.',
                    answer: 'Vivo en Madrid y tengo un perro.',
                    whyExplanation: 'Combines a regular -IR verb (vivo) with the irregular yo-form (tengo) — this is exactly how natives actually talk.',
                },
                {
                    type: 'translate',
                    prompt: 'I eat breakfast at eight and I leave at nine.',
                    answer: 'Como el desayuno a las ocho y salgo a las nueve.',
                    whyExplanation: 'Two verbs, two different patterns (como = regular, salgo = irregular) in one natural sentence.',
                },
                {
                    type: 'mcq',
                    prompt: '"We write" in Spanish is…',
                    options: ['escribimos', 'escriben', 'escribes', 'escribo'],
                    answer: 'escribimos',
                    whyExplanation: '-IR verbs take -imos for "nosotros" — escribir → escribimos.',
                },
                {
                    type: 'match',
                    pairs: [
                        { a: 'Yo como', b: 'I eat' },
                        { a: 'Ella vive', b: 'She lives' },
                        { a: 'Ellos beben', b: 'They drink' },
                        { a: 'Yo tengo', b: 'I have' },
                    ],
                },
            ],
            realLife: {
                prompt: 'Chat with Ecla for 2 minutes, in Spanish, describing your actual daily routine start to finish.',
                chatSeed: 'Hablemos de mi rutina diaria en español, usando verbos -ER, -IR y tengo/salgo/hago.',
            },
        },
    ]

    for (let i = 0; i < subLessons.length; i++) {
        const s = subLessons[i] as any
        await prisma.subLesson.upsert({
            where: { conceptId_orderIndex: { conceptId: concept.id, orderIndex: i } },
            update: { title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
            create: { conceptId: concept.id, orderIndex: i, title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
        })
    }

    console.log(`Seeded ${subLessons.length} sub-lessons into "${concept.name}"`)
}

main().finally(() => prisma.$disconnect())