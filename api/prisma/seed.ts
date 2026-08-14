import { PrismaClient, DeliveryMode } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding ecla database...')

    // 1. Create Course
    const course = await prisma.course.upsert({
        where: { id: 'course-spanish-a1' },
        update: {},
        create: {
            id: 'course-spanish-a1',
            languageCode: 'es',
            cefrLevel: 'A1',
            title: 'Spanish Foundations',
            isPublished: true,
        },
    })
    console.log(`  ✓ Course: ${course.title}`)

    // 2. Create Unit
    const unit = await prisma.unit.upsert({
        where: { id: 'unit-1-identity' },
        update: {},
        create: {
            id: 'unit-1-identity',
            courseId: course.id,
            title: 'Identity & States of Being',
            orderIndex: 1,
        },
    })
    console.log(`  ✓ Unit: ${unit.title}`)

    // ───────────────────────────────────────────────────────────
    // CONCEPT 1: Ser vs Estar (Emotions)
    // ───────────────────────────────────────────────────────────
    const concept1 = await prisma.concept.upsert({
        where: { id: 'concept-ser-estar-emotions' },
        update: {},
        create: {
            id: 'concept-ser-estar-emotions',
            unitId: unit.id,
            name: 'Ser vs Estar (Emotions)',
            cefrLevel: 'A1',
            grammarNote: 'Use "ser" for inherent characteristics. Use "estar" for temporary states and emotions.',
            vocabItems: [
                { word: 'feliz', translation: 'happy', exampleNeutral: 'Estoy feliz.' },
                { word: 'triste', translation: 'sad', exampleNeutral: 'Estoy triste.' },
                { word: 'cansado', translation: 'tired', exampleNeutral: 'Estoy cansado.' },
                { word: 'aburrido', translation: 'bored', exampleNeutral: 'Estoy aburrido.' },
                { word: 'ocupado', translation: 'busy', exampleNeutral: 'Estoy ocupado.' },
            ],
            orderIndex: 1,
            xpReward: 20,
        },
    })
    console.log(`  ✓ Concept 1: ${concept1.name}`)

    const concept1Variants = [
        {
            mode: DeliveryMode.DRILL, storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'I am happy (right now).', options: ['Soy feliz', 'Estoy feliz'], answer: 'Estoy feliz' },
                { type: 'mcq', prompt: 'I am tired.', options: ['Soy cansado', 'Estoy cansado'], answer: 'Estoy cansado' },
                { type: 'mcq', prompt: 'She is sad today.', options: ['Ella es triste hoy', 'Ella está triste hoy'], answer: 'Ella está triste hoy' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'Mateo just landed in Madrid. He lost his luggage, missed his connection, and is standing in the middle of the airport looking completely lost.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'Mateo says: "I am very tired after the flight."', options: ['Soy muy cansado después del vuelo', 'Estoy muy cansado después del vuelo'], answer: 'Estoy muy cansado después del vuelo' },
                { type: 'mcq', prompt: 'The airport worker asks: "Are you lost?"', options: ['¿Eres perdido?', '¿Estás perdido?'], answer: '¿Estás perdido?' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'In the song "Estoy Feliz" by El Canto del Loco, the singer uses "estar" because happiness here is a momentary feeling, not a permanent trait.', formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'Complete the lyric: "___ feliz cuando te veo"', options: ['Soy', 'Estoy'], answer: 'Estoy' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'In a professional setting, you might say "Estoy un poco cansado" to politely excuse yourself from a meeting, rather than the more blunt "Soy cansado" (which would imply you are a lazy person).', exercises: [
                { type: 'mcq', prompt: 'Polite excuse in a meeting: "I am a bit tired today."', options: ['Soy un poco cansado hoy', 'Estoy un poco cansado hoy'], answer: 'Estoy un poco cansado hoy' },
            ]
        },
    ]

    for (const v of concept1Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept1.id, mode: v.mode as DeliveryMode } },
            update: {},
            create: {
                conceptId: concept1.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // ───────────────────────────────────────────────────────────
    // CONCEPT 2: Ser vs Estar (Locations & Events)
    // ───────────────────────────────────────────────────────────
    const concept2 = await prisma.concept.upsert({
        where: { id: 'concept-ser-estar-locations' },
        update: {},
        create: {
            id: 'concept-ser-estar-locations',
            unitId: unit.id,
            name: 'Ser vs Estar (Locations & Events)',
            cefrLevel: 'A1',
            grammarNote: 'Use "estar" for where something is physically located. Use "ser" for where an event takes place.',
            vocabItems: [
                { word: 'el aeropuerto', translation: 'the airport' },
                { word: 'la boda', translation: 'the wedding' },
                { word: 'el hospital', translation: 'the hospital' },
            ],
            orderIndex: 2,
            xpReward: 20,
        },
    })
    console.log(`  ✓ Concept 2: ${concept2.name}`)

    const concept2Variants = [
        {
            mode: DeliveryMode.DRILL, storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'The hospital is far.', options: ['El hospital es lejos', 'El hospital está lejos'], answer: 'El hospital está lejos' },
                { type: 'fill_blank', prompt: 'The wedding is in Madrid. (event)', answer: 'es', hint: 'ser or estar?' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'Mateo is lost. He asks a stranger where the wedding is.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'Mateo asks: "Where is the wedding?" (Hint: Events take place using SER)', options: ['¿Dónde es la boda?', '¿Dónde está la boda?'], answer: '¿Dónde es la boda?' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'In Spain, weddings are often massive, multi-day events held in specific venues (fincas).', formalPhrase: null, exercises: [
                { type: 'translate', prompt: 'Translate: The wedding is in Segovia.', answer: 'La boda es en Segovia' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'When confirming a meeting location: "La reunión es en la oficina central."', exercises: [
                { type: 'fill_blank', prompt: 'The meeting is on the 5th floor. (La reunión ___ en el quinto piso)', answer: 'es' },
            ]
        },
    ]

    for (const v of concept2Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept2.id, mode: v.mode as DeliveryMode } },
            update: {},
            create: {
                conceptId: concept2.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // ───────────────────────────────────────────────────────────
    // CONCEPT 3: Present Tense (-AR Verbs)
    // ───────────────────────────────────────────────────────────
    const concept3 = await prisma.concept.upsert({
        where: { id: 'concept-present-ar' },
        update: {},
        create: {
            id: 'concept-present-ar',
            unitId: unit.id,
            name: 'Present Tense (-AR Verbs)',
            cefrLevel: 'A1',
            grammarNote: 'Drop the -ar and add: o, as, a, amos, áis, an.',
            vocabItems: [
                { word: 'hablar', translation: 'to speak' },
                { word: 'trabajar', translation: 'to work' },
                { word: 'estudiar', translation: 'to study' },
            ],
            orderIndex: 3,
            xpReward: 25,
        },
    })
    console.log(`  ✓ Concept 3: ${concept3.name}`)

    const concept3Variants = [
        {
            mode: DeliveryMode.DRILL, storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [
                { type: 'fill_blank', prompt: 'I speak Spanish. (Yo ___ español)', answer: 'hablo' },
                { type: 'mcq', prompt: 'We work here.', options: ['Trabajamos aquí', 'Trabajan aquí'], answer: 'Trabajamos aquí' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'Mateo tries to explain his job to the bride\'s father.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'translate', prompt: 'Translate: I work in technology.', answer: 'Trabajo en tecnología' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'In Spain, the workday often includes a long lunch break (la siesta is a myth, but the 2-hour lunch is real).', formalPhrase: null, exercises: [
                { type: 'fill_blank', prompt: 'We study Spanish. (Nosotros ___ español)', answer: 'estudiamos' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'In emails: "Hablo con el cliente mañana" (I speak with the client tomorrow).', exercises: [
                { type: 'mcq', prompt: 'I work from home.', options: ['Trabajo desde casa', 'Trabaja desde casa'], answer: 'Trabajo desde casa' },
            ]
        },
    ]

    for (const v of concept3Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept3.id, mode: v.mode as DeliveryMode } },
            update: {},
            create: {
                conceptId: concept3.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // Seed vocabulary for sm-2 flashcards
    const vocabWords = [
        { word: 'feliz', translation: 'happy' },
        { word: 'triste', translation: 'sad' },
        { word: 'cansado', translation: 'tired' },
        { word: 'aburrido', translation: 'bored' },
        { word: 'ocupado', translation: 'busy' },
        { word: 'el aeropuerto', translation: 'the airport' },
        { word: 'la boda', translation: 'the wedding' },
        { word: 'hablar', translation: 'to speak' },
        { word: 'trabajar', translation: 'to work' },
        { word: 'estudiar', translation: 'to study' },
    ]

    for (const v of vocabWords) {
        await prisma.vocabulary.upsert({
            where: { id: `vocab-${v.word}` },
            update: {},
            create: {
                id: `vocab-${v.word}`,
                word: v.word,
                translation: v.translation,
                courseId: course.id,
                difficulty: 1,
            },
        })
    }
    console.log(`  ✓ Seeded ${vocabWords.length} Vocabulary words for Flashcards`)

    console.log('\nSeeding complete!')
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })