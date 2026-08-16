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
    // Story thread: Mateo just landed, lost his luggage
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
                { type: 'mcq', prompt: 'I am happy (right now).', options: ['Soy feliz', 'Estoy feliz'], answer: 'Estoy feliz', whyExplanation: 'Happiness right now is a temporary state — use "estar," not "ser."' },
                { type: 'mcq', prompt: 'I am tired.', options: ['Soy cansado', 'Estoy cansado'], answer: 'Estoy cansado', whyExplanation: 'Tiredness always uses "estar" — nobody is permanently tired as a trait.' },
                { type: 'mcq', prompt: 'She is sad today.', options: ['Ella es triste hoy', 'Ella está triste hoy'], answer: 'Ella está triste hoy', whyExplanation: '"Hoy" (today) is the giveaway — a feeling tied to a specific day is temporary, so "está."' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'Mateo just landed in Madrid. He lost his luggage, missed his connection, and is standing in the middle of the airport looking completely lost.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'Mateo says: "I am very tired after the flight."', options: ['Soy muy cansado después del vuelo', 'Estoy muy cansado después del vuelo'], answer: 'Estoy muy cansado después del vuelo', whyExplanation: 'Even mid-crisis, "cansado" is temporary — Mateo will not be tired forever, so "estoy."' },
                { type: 'mcq', prompt: 'The airport worker asks: "Are you lost?"', options: ['¿Eres perdido?', '¿Estás perdido?'], answer: '¿Estás perdido?', whyExplanation: 'Being lost is a passing situation, not a permanent identity — "estás," never "eres."' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'In the song "Estoy Feliz" by El Canto del Loco, the singer uses "estar" because happiness here is a momentary feeling, not a permanent trait. Notice: songs about fleeting emotions almost always use "estar," never "ser."', formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'Complete the lyric: "___ feliz cuando te veo"', options: ['Soy', 'Estoy'], answer: 'Estoy', whyExplanation: '"When I see you" signals a specific, triggered moment of happiness — temporary, so "estoy."' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'In a professional setting, you might say "Estoy un poco cansado" to politely excuse yourself from a meeting, rather than the more blunt "Soy cansado" (which would incorrectly imply you are a lazy person as a personality trait).', exercises: [
                { type: 'mcq', prompt: 'Polite excuse in a meeting: "I am a bit tired today."', options: ['Soy un poco cansado hoy', 'Estoy un poco cansado hoy'], answer: 'Estoy un poco cansado hoy', whyExplanation: 'Using "soy" here would accidentally describe yourself as lazy by nature — a real, common mistake in professional Spanish.' },
            ]
        },
    ]

    for (const v of concept1Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept1.id, mode: v.mode as DeliveryMode } },
            update: { exercises: v.exercises, storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase },
            create: {
                conceptId: concept1.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // ───────────────────────────────────────────────────────────
    // CONCEPT 2: Ser vs Estar (Locations & Events)
    // Story thread: Mateo asks for directions to the wedding
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
                { word: 'lejos', translation: 'far' },
                { word: 'cerca', translation: 'near' },
            ],
            orderIndex: 2,
            xpReward: 20,
        },
    })
    console.log(`  ✓ Concept 2: ${concept2.name}`)

    const concept2Variants = [
        {
            mode: DeliveryMode.DRILL, storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'The hospital is far.', options: ['El hospital es lejos', 'El hospital está lejos'], answer: 'El hospital está lejos', whyExplanation: 'A building\'s physical location always uses "estar" — the hospital itself is a place, not an event.' },
                { type: 'fill_blank', prompt: 'The wedding is in Madrid. (event)', answer: 'es', hint: 'ser or estar?', whyExplanation: 'A wedding is an event that happens somewhere — events take place with "ser," not "estar."' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'Still lost, Mateo asks a stranger where the wedding is — he\'s confusing it with directions to a building.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'mcq', prompt: 'Mateo asks: "Where is the wedding?" (Hint: Events take place using SER)', options: ['¿Dónde es la boda?', '¿Dónde está la boda?'], answer: '¿Dónde es la boda?', whyExplanation: 'This trips up almost every learner — a wedding is an event, so even though it sounds like "location," it takes "ser."' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'In Spain, weddings are often massive, multi-day events held in specific countryside venues called "fincas." Notice: locals always say "la boda ES en la finca" — never "está" — because the wedding is the event, not the venue itself.', formalPhrase: null, exercises: [
                { type: 'translate', prompt: 'Translate: The wedding is in Segovia.', answer: 'La boda es en Segovia', whyExplanation: 'Same rule as always — the wedding-as-event uses "es," regardless of how far away Segovia is.' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'When confirming a meeting location in an email: "La reunión es en la oficina central." Using "está" here is one of the most common mistakes non-native speakers make in business Spanish.', exercises: [
                { type: 'fill_blank', prompt: 'The meeting is on the 5th floor. (La reunión ___ en el quinto piso)', answer: 'es', whyExplanation: 'A meeting is an event, like a wedding — "es," not "está," even though it sounds like you\'re stating a location.' },
            ]
        },
    ]

    for (const v of concept2Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept2.id, mode: v.mode as DeliveryMode } },
            update: { exercises: v.exercises, storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase },
            create: {
                conceptId: concept2.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // ───────────────────────────────────────────────────────────
    // CONCEPT 3: Present Tense (-AR Verbs)
    // Story thread: Mateo explains his job to the bride's father
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
                { word: 'explicar', translation: 'to explain' },
            ],
            orderIndex: 3,
            xpReward: 25,
        },
    })
    console.log(`  ✓ Concept 3: ${concept3.name}`)

    const concept3Variants = [
        {
            mode: DeliveryMode.DRILL, storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [
                { type: 'fill_blank', prompt: 'I speak Spanish. (Yo ___ español)', answer: 'hablo', whyExplanation: '-AR verbs drop -ar and add -o for "yo": hablar → hablo.' },
                { type: 'mcq', prompt: 'We work here.', options: ['Trabajamos aquí', 'Trabajan aquí'], answer: 'Trabajamos aquí', whyExplanation: '"Nosotros" (we) takes -amos: trabajar → trabajamos.' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'Now at the wedding reception uninvited, Mateo nervously tries to explain his job to the bride\'s father to justify why he\'s there.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'translate', prompt: 'Translate: I work in technology.', answer: 'Trabajo en tecnología', whyExplanation: 'Regular -AR conjugation for "yo" — trabajar → trabajo.' },
                { type: 'fill_blank', prompt: 'Mateo says: "I explain everything, I promise!" (Yo ___ todo, ¡lo prometo!)', answer: 'explico', whyExplanation: 'explicar → explico, following the same -AR pattern as hablar and trabajar.' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'In Spain, the workday often includes a long lunch break (the siesta itself is mostly a myth today, but the 2-hour midday break is real). Notice: Spaniards say "trabajamos hasta las ocho" (we work until eight) because the day extends later to accommodate the long lunch.', formalPhrase: null, exercises: [
                { type: 'fill_blank', prompt: 'We study Spanish. (Nosotros ___ español)', answer: 'estudiamos', whyExplanation: 'estudiar → estudiamos for "nosotros," same -amos pattern.' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'In emails: "Hablo con el cliente mañana" (I speak with the client tomorrow) — a common, natural way to state a planned action using present tense instead of a future tense.', exercises: [
                { type: 'mcq', prompt: 'I work from home.', options: ['Trabajo desde casa', 'Trabaja desde casa'], answer: 'Trabajo desde casa', whyExplanation: '"Trabaja" would mean "he/she works" — the -o ending is what makes it "I."' },
            ]
        },
    ]

    for (const v of concept3Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept3.id, mode: v.mode as DeliveryMode } },
            update: { exercises: v.exercises, storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase },
            create: {
                conceptId: concept3.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // ───────────────────────────────────────────────────────────
    // CONCEPT 4 (NEW): Present Tense (-ER/-IR Verbs)
    // Story thread: the aftermath — Mateo is invited to stay for cake
    // ───────────────────────────────────────────────────────────
    const concept4 = await prisma.concept.upsert({
        where: { id: 'concept-present-er-ir' },
        update: {},
        create: {
            id: 'concept-present-er-ir',
            unitId: unit.id,
            name: 'Present Tense (-ER / -IR Verbs)',
            cefrLevel: 'A1',
            grammarNote: '-ER and -IR verbs share nearly identical present-tense endings; only the "nosotros" form differs (-emos vs -imos).',
            vocabItems: [
                { word: 'comer', translation: 'to eat' },
                { word: 'beber', translation: 'to drink' },
                { word: 'vivir', translation: 'to live' },
                { word: 'escribir', translation: 'to write' },
            ],
            orderIndex: 4,
            xpReward: 25,
        },
    })
    console.log(`  ✓ Concept 4: ${concept4.name}`)

    const concept4Variants = [
        {
            mode: DeliveryMode.DRILL, storyBeat: null, culturalRef: null, formalPhrase: null, exercises: [
                { type: 'fill_blank', prompt: 'I eat breakfast at 8. (Yo ___ el desayuno a las ocho)', answer: 'como', whyExplanation: 'comer → como for "yo," dropping -er and adding -o.' },
                { type: 'mcq', prompt: 'She lives in Sevilla.', options: ['Ella vive en Sevilla', 'Ella vives en Sevilla'], answer: 'Ella vive en Sevilla', whyExplanation: '"Ella" (she) takes the -e ending: vivir → vive.' },
            ]
        },
        {
            mode: DeliveryMode.STORY, storyBeat: 'The bride\'s family, charmed by his honesty, invites Mateo to stay for cake. He raises a toast, relieved.', culturalRef: null, formalPhrase: null, exercises: [
                { type: 'translate', prompt: 'Translate: "We eat cake and we drink wine!" (Mateo, toasting)', answer: 'Comemos pastel y bebemos vino', whyExplanation: 'Both -ER verbs take -emos for "nosotros": comer → comemos, beber → bebemos.' },
            ]
        },
        {
            mode: DeliveryMode.IMMERSION, storyBeat: null, culturalRef: 'At Spanish weddings, guests often write a short note in a guestbook for the couple. Notice the verb: "Escribo estas palabras con mucho cariño" (I write these words with much affection) — "escribo" is the exact same pattern as comer/vivir, just the -IR family.', formalPhrase: null, exercises: [
                { type: 'fill_blank', prompt: 'I write with affection. (Yo ___ con cariño)', answer: 'escribo', whyExplanation: 'escribir → escribo, same -o ending pattern as every other "yo" form you\'ve learned.' },
            ]
        },
        {
            mode: DeliveryMode.PROFESSIONAL, storyBeat: null, culturalRef: null, formalPhrase: 'In business correspondence: "Le escribo para confirmar la reunión" (I am writing to confirm the meeting) — a standard formal email opener.', exercises: [
                { type: 'mcq', prompt: 'We live in the same city.', options: ['Vivimos en la misma ciudad', 'Viven en la misma ciudad'], answer: 'Vivimos en la misma ciudad', whyExplanation: '-IR verbs take -imos for "nosotros": vivir → vivimos.' },
            ]
        },
    ]

    for (const v of concept4Variants) {
        await prisma.lessonVariant.upsert({
            where: { conceptId_mode: { conceptId: concept4.id, mode: v.mode as DeliveryMode } },
            update: { exercises: v.exercises, storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase },
            create: {
                conceptId: concept4.id, mode: v.mode as DeliveryMode,
                storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises,
            },
        })
    }

    // ───────────────────────────────────────────────────────────
    // Vocabulary for SM-2 flashcards
    // ───────────────────────────────────────────────────────────
    const vocabWords = [
        { word: 'feliz', translation: 'happy' },
        { word: 'triste', translation: 'sad' },
        { word: 'cansado', translation: 'tired' },
        { word: 'aburrido', translation: 'bored' },
        { word: 'ocupado', translation: 'busy' },
        { word: 'el aeropuerto', translation: 'the airport' },
        { word: 'la boda', translation: 'the wedding' },
        { word: 'lejos', translation: 'far' },
        { word: 'cerca', translation: 'near' },
        { word: 'hablar', translation: 'to speak' },
        { word: 'trabajar', translation: 'to work' },
        { word: 'estudiar', translation: 'to study' },
        { word: 'explicar', translation: 'to explain' },
        { word: 'comer', translation: 'to eat' },
        { word: 'beber', translation: 'to drink' },
        { word: 'vivir', translation: 'to live' },
        { word: 'escribir', translation: 'to write' },
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

    console.log('\nSeeding complete! Now run: npx tsx prisma/seedSublessons.ts')
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })