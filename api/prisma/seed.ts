import { PrismaClient, DeliveryMode } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Fluenta database...')

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

    // 3. Create Concept
    const concept = await prisma.concept.upsert({
        where: { id: 'concept-ser-estar-emotions' },
        update: {},
        create: {
            id: 'concept-ser-estar-emotions',
            unitId: unit.id,
            name: 'Ser vs Estar (Emotions)',
            cefrLevel: 'A1',
            grammarNote:
                'Use "ser" for inherent characteristics. Use "estar" for temporary states and emotions.',
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
    console.log(`  ✓ Concept: ${concept.name}`)

    // 4. Create LessonVariants (one per mode)
    const variants = [
        {
            mode: DeliveryMode.DRILL as DeliveryMode,
            storyBeat: null,
            culturalRef: null,
            formalPhrase: null,
            exercises: [
                {
                    type: 'mcq',
                    prompt: 'I am happy (right now).',
                    options: ['Soy feliz', 'Estoy feliz'],
                    answer: 'Estoy feliz',
                },
                {
                    type: 'mcq',
                    prompt: 'I am tired.',
                    options: ['Soy cansado', 'Estoy cansado'],
                    answer: 'Estoy cansado',
                },
                {
                    type: 'mcq',
                    prompt: 'She is sad today.',
                    options: ['Ella es triste hoy', 'Ella está triste hoy'],
                    answer: 'Ella está triste hoy',
                },
            ],
        },
        {
            mode: DeliveryMode.STORY as DeliveryMode,
            storyBeat:
                'Mateo just landed in Madrid. He lost his luggage, missed his connection, and is standing in the middle of the airport looking completely lost.',
            culturalRef: null,
            formalPhrase: null,
            exercises: [
                {
                    type: 'mcq',
                    prompt: 'Mateo says: "I am very tired after the flight."',
                    options: ['Soy muy cansado después del vuelo', 'Estoy muy cansado después del vuelo'],
                    answer: 'Estoy muy cansado después del vuelo',
                },
                {
                    type: 'mcq',
                    prompt: 'The airport worker asks: "Are you lost?"',
                    options: ['¿Eres perdido?', '¿Estás perdido?'],
                    answer: '¿Estás perdido?',
                },
            ],
        },
        {
            mode: DeliveryMode.IMMERSION as DeliveryMode,
            storyBeat: null,
            culturalRef:
                'In the song "Estoy Feliz" by El Canto del Loco, the singer uses "estar" because happiness here is a momentary feeling, not a permanent trait.',
            formalPhrase: null,
            exercises: [
                {
                    type: 'mcq',
                    prompt: 'Complete the lyric: "___ feliz cuando te veo"',
                    options: ['Soy', 'Estoy'],
                    answer: 'Estoy',
                },
            ],
        },
        {
            mode: DeliveryMode.PROFESSIONAL as DeliveryMode,
            storyBeat: null,
            culturalRef: null,
            formalPhrase:
                'In a professional setting, you might say "Estoy un poco cansado" to politely excuse yourself from a meeting, rather than the more blunt "Soy cansado" (which would imply you are a lazy person).',
            exercises: [
                {
                    type: 'mcq',
                    prompt: 'Polite excuse in a meeting: "I am a bit tired today."',
                    options: ['Soy un poco cansado hoy', 'Estoy un poco cansado hoy'],
                    answer: 'Estoy un poco cansado hoy',
                },
            ],
        },
    ]

    for (const variant of variants) {
        await prisma.lessonVariant.upsert({
            where: {
                conceptId_mode: {
                    conceptId: concept.id,
                    mode: variant.mode,
                },
            },
            update: {},
            create: {
                conceptId: concept.id,
                mode: variant.mode,
                storyBeat: variant.storyBeat,
                culturalRef: variant.culturalRef,
                formalPhrase: variant.formalPhrase,
                exercises: variant.exercises,
            },
        })
        console.log(`  ✓ Variant: ${variant.mode}`)
    }

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