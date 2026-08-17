import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding sub-lessons for all concepts...')

    const course = await prisma.course.findFirst({
        where: { isPublished: true },
        include: { units: { include: { concepts: { orderBy: { orderIndex: 'asc' } } } } },
    })
    if (!course) throw new Error('No published course')

    const allConcepts = course.units.flatMap(u => u.concepts)
    console.log(`  Found ${allConcepts.length} concepts to seed`)

    // ────────────────────────────────────────────────
    // CONCEPT 1: Ser vs Estar (Emotions)
    // ────────────────────────────────────────────────
    const concept1 = allConcepts.find(c => c.id === 'concept-ser-estar-emotions')
    if (concept1) {
        const subs = [
            {
                title: 'Understand: feelings use ESTAR',
                icon: 'book-open',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Emotions are temporary — you feel happy today, maybe sad tomorrow. In Spanish, temporary states always use "estar," never "ser." This is the single biggest rule in the whole language.' },
                    { type: 'explain', text: 'Conjugation of "estar" with "yo": estoy. With "tú": estás. With "él/ella": está. With "nosotros": estamos. With "ellos/ellas": están.' },
                    { type: 'example', es: 'Estoy feliz hoy.', en: 'I am happy today.' },
                    { type: 'example', es: 'Ella está triste.', en: 'She is sad.' },
                    { type: 'example', es: 'Estamos cansados.', en: 'We are tired.' },
                    { type: 'vocab', items: [
                        { word: 'feliz', translation: 'happy' },
                        { word: 'triste', translation: 'sad' },
                        { word: 'cansado', translation: 'tired' },
                        { word: 'aburrido', translation: 'bored' },
                        { word: 'ocupado', translation: 'busy' },
                    ]},
                    { type: 'tip', text: 'Look for time words like "hoy" (today), "ahora" (now), "esta mañana" (this morning). They almost always mean "estar," because they point to a specific moment.' },
                ],
                exercises: [
                    { type: 'mcq', prompt: 'I am happy (right now).', options: ['Soy feliz', 'Estoy feliz'], answer: 'Estoy feliz', whyExplanation: 'Happiness right now is a temporary state — use "estar," not "ser."' },
                    { type: 'mcq', prompt: 'She is tired today.', options: ['Ella es cansada hoy', 'Ella está cansada hoy'], answer: 'Ella está cansada hoy', whyExplanation: '"Hoy" (today) is the giveaway — a feeling tied to a specific day is temporary, so "está."' },
                    { type: 'fill_blank', prompt: 'Nosotros ___ ocupados. (estar)', answer: 'estamos', whyExplanation: 'Nosotros form of "estar" is "estamos." Busy-ness is always a temporary state.' },
                    { type: 'listen_choose', audio: 'Estoy triste.', options: ['I am sad.', 'I am boring.', 'I am tired.'], answer: 'I am sad.', whyExplanation: '"Estoy triste" — "triste" means sad, and "estoy" confirms it\'s a temporary feeling.' },
                    { type: 'match', pairs: [
                        { a: 'Estoy feliz', b: 'I am happy' },
                        { a: 'Estás triste', b: 'You are sad' },
                        { a: 'Está cansado', b: 'He is tired' },
                        { a: 'Estamos aburridos', b: 'We are bored' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud how you feel right now: "Estoy..." and then one emotion from the vocab list.',
                    chatSeed: 'Quiero practicar emociones con "estar": estoy feliz, estoy cansado, estoy triste.',
                },
            },
            {
                title: 'Hear the feelings',
                icon: 'ear',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Native speakers often drop the subject pronoun (yo, tú, él). The verb ending itself tells you who is feeling the emotion. Train your ear to catch "estoy" vs "está" vs "están."' },
                    { type: 'example', es: '¿Cómo estás? — Estoy bien.', en: '"How are you?" — "I am fine."' },
                    { type: 'example', es: 'Están muy contentos hoy.', en: 'They are very happy today.' },
                    { type: 'tip', text: 'Tap 🔊 on every example below at least twice. Your ear learns the rhythm faster than your eyes learn the rule.' },
                ],
                exercises: [
                    { type: 'listen_choose', audio: 'Estoy cansado.', options: ['I am tired.', 'You are tired.', 'He is tired.'], answer: 'I am tired.', whyExplanation: '"Estoy" = "yo" form of estar, so it means "I am."' },
                    { type: 'listen_choose', audio: 'Ella está triste.', options: ['She is sad.', 'He is sad.', 'They are sad.'], answer: 'She is sad.', whyExplanation: '"Está" + "ella" confirms she is sad. "Está" is the él/ella/usted form.' },
                    { type: 'listen_type', audio: 'Estamos felices hoy.', answer: 'Estamos felices hoy.' },
                    { type: 'mcq', prompt: '"They are bored" in Spanish is…', options: ['Están aburridos', 'Estamos aburridos', 'Estoy aburrido'], answer: 'Están aburridos', whyExplanation: '"Ellos/ellas" form of estar is "están." "Aburridos" matches the plural subject.' },
                    { type: 'listen_choose', audio: '¿Estás ocupado?', options: ['Are you busy?', 'Is he busy?', 'Are we busy?'], answer: 'Are you busy?', whyExplanation: '"Estás" is the "tú" (you) form of estar.' },
                ],
                realLife: {
                    prompt: 'Close your eyes and say out loud: "¿Cómo estás?" then answer yourself with a different emotion each time.',
                    chatSeed: 'Practica escuchar frases con emociones: ¿Cómo estás? Estoy feliz, está cansado.',
                },
            },
            {
                title: 'Watch out: meaning-changing adjectives',
                icon: 'alert-triangle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'A handful of adjectives actually CHANGE their meaning depending on whether you use "ser" or "estar." These are the ones that trip up even advanced learners, so learn them as exceptions now.' },
                    { type: 'example', es: 'Estoy aburrido. (not "soy aburrido")', en: 'I am bored. (If you said "soy aburrido," you\'d be saying "I am a boring person"!)' },
                    { type: 'example', es: 'Juan es aburrido.', en: 'Juan is boring (as a personality trait).' },
                    { type: 'example', es: 'Estoy listo para salir.', en: 'I am ready to leave.' },
                    { type: 'example', es: 'Juan es listo.', en: 'Juan is smart (as a trait).' },
                    { type: 'vocab', items: [
                        { word: 'aburrido (estar) = bored', translation: 'vs ser aburrido = boring' },
                        { word: 'listo (estar) = ready', translation: 'vs ser listo = smart' },
                        { word: 'malo (estar) = sick/ill', translation: 'vs ser malo = a bad person' },
                        { word: 'verde (estar) = unripe', translation: 'vs ser verde = green color' },
                    ]},
                    { type: 'tip', text: 'The pattern: "estar" version is a state or situation; "ser" version is a personality trait or permanent quality.' },
                ],
                exercises: [
                    { type: 'mcq', prompt: '"I am bored" (feeling right now, not a boring person)', options: ['Soy aburrido', 'Estoy aburrido'], answer: 'Estoy aburrido', whyExplanation: 'Boredom is a temporary feeling — "estar aburrido." "Soy aburrido" would mean "I am a boring person."' },
                    { type: 'mcq', prompt: '"Juan is smart" (as a personality trait)', options: ['Juan está listo', 'Juan es listo'], answer: 'Juan es listo', whyExplanation: 'Smartness as a trait uses "ser listo." "Estar listo" would mean "Juan is ready (to do something)."' },
                    { type: 'fill_blank', prompt: 'Mi hermano ___ enfermo hoy. (ser or estar)', answer: 'está', whyExplanation: 'Sickness is always temporary — use "estar enfermo." "Ser enfermo" would mean "he is a sick person" as a trait, which is wrong.' },
                    { type: 'listen_choose', audio: 'Estoy aburrido en clase.', options: ['I am bored in class.', 'I am boring in class.'], answer: 'I am bored in class.', whyExplanation: '"Estoy aburrido" = I feel bored. The context (in class) confirms it\'s a current feeling.' },
                    { type: 'match', pairs: [
                        { a: 'Estoy aburrido', b: 'I am bored' },
                        { a: 'Soy aburrido', b: 'I am boring' },
                        { a: 'Estoy listo', b: 'I am ready' },
                        { a: 'Soy listo', b: 'I am smart' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud one thing you are bored of right now ("Estoy aburrido de...") and one thing you are ready for ("Estoy listo para...").',
                    chatSeed: 'Practica los adjetivos que cambian de significado con ser vs estar: aburrido, listo, malo.',
                },
            },
            {
                title: 'Use it: talk about your feelings today',
                icon: 'message-circle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Real feeling-sentences follow: subject (optional) + estoy/está/están + emotion + optional reason. You can now describe how you feel AND why.' },
                    { type: 'example', es: 'Estoy cansado porque trabajo mucho.', en: 'I am tired because I work a lot.' },
                    { type: 'example', es: 'Estoy feliz hoy, es mi cumpleaños.', en: 'I am happy today, it is my birthday.' },
                ],
                exercises: [
                    { type: 'translate', prompt: 'I am happy because it is Friday.', answer: 'Estoy feliz porque es viernes', whyExplanation: '"Estoy" for the feeling, "porque" (because) introduces the reason. "Viernes" = Friday.' },
                    { type: 'translate', prompt: 'She is tired after work.', answer: 'Ella está cansada después del trabajo', whyExplanation: '"Estar + cansada" matches the feminine subject. "Después del trabajo" = after work.' },
                    { type: 'mcq', prompt: '"We are busy today" in Spanish is…', options: ['Estamos ocupados hoy', 'Somos ocupados hoy', 'Están ocupados hoy'], answer: 'Estamos ocupados hoy', whyExplanation: '"Nosotros" form of estar is "estamos." Being busy is always a state, so "estar."' },
                    { type: 'match', pairs: [
                        { a: 'Estoy feliz', b: 'I am happy' },
                        { a: 'Ella está triste', b: 'She is sad' },
                        { a: 'Estamos cansados', b: 'We are tired' },
                        { a: 'Están aburridos', b: 'They are bored' },
                    ]},
                ],
                realLife: {
                    prompt: 'Chat with Ecla for 2 minutes describing how you feel at different times of day (morning, afternoon, evening).',
                    chatSeed: 'Hablemos de cómo me siento en diferentes momentos del día usando "estar" + emociones.',
                },
            },
        ]

        for (let i = 0; i < subs.length; i++) {
            const s = subs[i] as any
            await prisma.subLesson.upsert({
                where: { conceptId_orderIndex: { conceptId: concept1.id, orderIndex: i } },
                update: { title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
                create: { conceptId: concept1.id, orderIndex: i, title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
            })
        }
        console.log(`  ✓ Seeded ${subs.length} sub-lessons into "${concept1.name}"`)
    }

    // ────────────────────────────────────────────────
    // CONCEPT 2: Ser vs Estar (Locations & Events)
    // ────────────────────────────────────────────────
    const concept2 = allConcepts.find(c => c.id === 'concept-ser-estar-locations')
    if (concept2) {
        const subs = [
            {
                title: 'Understand: places vs events',
                icon: 'book-open',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Here is the one rule that trips up almost every learner: physical location = "estar," but where an event takes place = "ser." A hospital is a place ("está"), but a wedding is an event ("es").' },
                    { type: 'explain', text: 'Ask yourself: is this a THING that sits somewhere, or an EVENT that happens somewhere? Thing = estar. Event = ser.' },
                    { type: 'example', es: 'El hospital está lejos.', en: 'The hospital is far. (a thing, located somewhere)' },
                    { type: 'example', es: 'La boda es en Madrid.', en: 'The wedding is in Madrid. (an event that takes place)' },
                    { type: 'example', es: 'La reunión es en la oficina.', en: 'The meeting is at the office. (an event)' },
                    { type: 'vocab', items: [
                        { word: 'el aeropuerto', translation: 'the airport' },
                        { word: 'la boda', translation: 'the wedding' },
                        { word: 'el hospital', translation: 'the hospital' },
                        { word: 'la reunión', translation: 'the meeting' },
                        { word: 'la fiesta', translation: 'the party' },
                    ]},
                    { type: 'tip', text: 'Events are things with a start time and an end time: meetings, weddings, parties, concerts, classes. Places are buildings or locations on a map.' },
                ],
                exercises: [
                    { type: 'mcq', prompt: 'The hospital is far.', options: ['El hospital es lejos', 'El hospital está lejos'], answer: 'El hospital está lejos', whyExplanation: 'A hospital is a building, a physical location — always "estar."' },
                    { type: 'fill_blank', prompt: 'The wedding ___ in Madrid. (event)', answer: 'es', whyExplanation: 'A wedding is an event that takes place — "ser," not "estar."' },
                    { type: 'mcq', prompt: 'The party is at my house.', options: ['La fiesta es en mi casa', 'La fiesta está en mi casa'], answer: 'La fiesta es en mi casa', whyExplanation: 'A party is an event with a start and end time — "ser," even though it sounds like a location.' },
                    { type: 'listen_choose', audio: 'El aeropuerto está cerca.', options: ['The airport is near.', 'The airport takes place near.'], answer: 'The airport is near.', whyExplanation: '"Está" confirms it\'s a location, not an event.' },
                    { type: 'match', pairs: [
                        { a: 'El hospital está', b: 'The hospital is (located)' },
                        { a: 'La boda es', b: 'The wedding takes place' },
                        { a: 'La reunión es', b: 'The meeting takes place' },
                        { a: 'La fiesta es', b: 'The party takes place' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud one place near you using "está" and one event you have this week using "es."',
                    chatSeed: 'Quiero practicar la diferencia entre "ser" (eventos) y "estar" (lugares físicos).',
                },
            },
            {
                title: 'Hear location vs event',
                icon: 'ear',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Native speakers say "es" and "está" almost identically in fast speech. Train your ear to hear the difference by listening for the SUBJECT: events (boda, reunión, fiesta, concierto) = "es." Places (hospital, aeropuerto, parque) = "está."' },
                    { type: 'example', es: '¿Dónde es la reunión? — Es en la oficina.', en: '"Where is the meeting?" — "At the office."' },
                    { type: 'example', es: '¿Dónde está el baño? — Está al fondo.', en: '"Where is the bathroom?" — "At the back."' },
                    { type: 'tip', text: 'If the question starts with "¿Dónde es...?" the answer will be an event. If "¿Dónde está...?" it\'s a physical location.' },
                ],
                exercises: [
                    { type: 'listen_choose', audio: '¿Dónde es la boda?', options: ['Where does the wedding take place?', 'Where is the wedding located?'], answer: 'Where does the wedding take place?', whyExplanation: '"Es" = event question. A wedding is an event.' },
                    { type: 'listen_choose', audio: '¿Dónde está el hospital?', options: ['Where is the hospital located?', 'Where does the hospital take place?'], answer: 'Where is the hospital located?', whyExplanation: '"Está" = location question. A hospital is a physical place.' },
                    { type: 'listen_type', audio: 'La reunión es en la oficina central.', answer: 'La reunión es en la oficina central.' },
                    { type: 'mcq', prompt: '"Where is the concert?" (event)', options: ['¿Dónde es el concierto?', '¿Dónde está el concierto?'], answer: '¿Dónde es el concierto?', whyExplanation: 'A concert is an event, so "¿Dónde es...?" is correct.' },
                    { type: 'listen_choose', audio: 'El aeropuerto está muy lejos.', options: ['The airport is very far (located).', 'The airport takes place very far.'], answer: 'The airport is very far (located).', whyExplanation: '"Está" = physical location of the airport.' },
                ],
                realLife: {
                    prompt: 'Close your eyes. Ask yourself out loud: "¿Dónde es la próxima fiesta?" then answer with a location.',
                    chatSeed: 'Practica escuchar preguntas con "¿Dónde es?" (eventos) y "¿Dónde está?" (lugares).',
                },
            },
            {
                title: 'Watch out: the wedding trap',
                icon: 'alert-triangle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Almost every English speaker says "la boda está en..." the first few times — it SOUNDS like a location, so your brain reaches for "estar." But a wedding is an event. This is the single most common mistake in Spanish, and the fix is to memorize "la boda es" as a chunk.' },
                    { type: 'example', es: 'La boda ES en Segovia. (not "está")', en: 'The wedding takes place in Segovia.' },
                    { type: 'example', es: 'El concierto ES en el parque. (not "está")', en: 'The concert takes place in the park.' },
                    { type: 'example', es: 'La clase ES a las diez.', en: 'The class takes place at ten o\'clock.' },
                    { type: 'vocab', items: [
                        { word: 'la boda', translation: 'the wedding → ES' },
                        { word: 'el concierto', translation: 'the concert → ES' },
                        { word: 'la clase', translation: 'the class → ES' },
                        { word: 'la fiesta', translation: 'the party → ES' },
                        { word: 'la reunión', translation: 'the meeting → ES' },
                    ]},
                    { type: 'tip', text: 'Memorize this phrase exactly: "La boda ES en..." Say it out loud ten times. Your brain will stop reaching for "está."' },
                ],
                exercises: [
                    { type: 'mcq', prompt: 'The wedding is in Segovia.', options: ['La boda es en Segovia', 'La boda está en Segovia'], answer: 'La boda es en Segovia', whyExplanation: 'A wedding is an event, always "es." This is THE classic trap in Spanish.' },
                    { type: 'fill_blank', prompt: 'El concierto ___ en el parque esta noche.', answer: 'es', whyExplanation: 'Concert = event = "es." Not "está," even though it sounds like a location.' },
                    { type: 'mcq', prompt: 'The class is at 10.', options: ['La clase es a las diez', 'La clase está a las diez'], answer: 'La clase es a las diez', whyExplanation: 'A class is an event with a scheduled time — "ser" is correct.' },
                    { type: 'listen_choose', audio: 'La fiesta es en mi casa el sábado.', options: ['The party takes place at my house on Saturday.', 'The party is located at my house on Saturday.'], answer: 'The party takes place at my house on Saturday.', whyExplanation: '"Es" = the party is an event.' },
                    { type: 'match', pairs: [
                        { a: 'La boda es', b: 'Wedding (event)' },
                        { a: 'El concierto es', b: 'Concert (event)' },
                        { a: 'El hospital está', b: 'Hospital (location)' },
                        { a: 'La clase es', b: 'Class (event)' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud three events you have this week, each starting with the name of the event and "es en..."',
                    chatSeed: 'Practica "la boda es", "la reunión es", "la fiesta es" — eventos, no lugares.',
                },
            },
            {
                title: 'Use it: give directions and event info',
                icon: 'message-circle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Real conversations often mix locations and events in the same sentence. You now have enough to give someone directions AND tell them when something is happening.' },
                    { type: 'example', es: 'La boda es en la finca, que está en las afueras.', en: 'The wedding is at the estate, which is located on the outskirts.' },
                    { type: 'example', es: 'La reunión es a las tres en la oficina central.', en: 'The meeting is at three in the main office.' },
                ],
                exercises: [
                    { type: 'translate', prompt: 'The wedding is in Madrid on Saturday.', answer: 'La boda es en Madrid el sábado', whyExplanation: 'Wedding = event = "es." Day of week uses "el" + day.' },
                    { type: 'translate', prompt: 'The hospital is near the airport.', answer: 'El hospital está cerca del aeropuerto', whyExplanation: 'Both are physical places, so both use "estar." "Del" = "de + el."' },
                    { type: 'mcq', prompt: '"The party takes place at my house" in Spanish…', options: ['La fiesta es en mi casa', 'La fiesta está en mi casa'], answer: 'La fiesta es en mi casa', whyExplanation: 'A party is an event — "es," not "está."' },
                    { type: 'match', pairs: [
                        { a: 'La boda es en Madrid', b: 'Wedding in Madrid (event)' },
                        { a: 'El hospital está cerca', b: 'Hospital is near (location)' },
                        { a: 'La reunión es a las tres', b: 'Meeting at 3 (event)' },
                        { a: 'El aeropuerto está lejos', b: 'Airport is far (location)' },
                    ]},
                ],
                realLife: {
                    prompt: 'Chat with Ecla describing one event you have this week and one place you go often, using both "es" and "está" correctly.',
                    chatSeed: 'Hablemos de mis eventos de la semana y los lugares a los que voy, mezclando "ser" y "estar".',
                },
            },
        ]

        for (let i = 0; i < subs.length; i++) {
            const s = subs[i] as any
            await prisma.subLesson.upsert({
                where: { conceptId_orderIndex: { conceptId: concept2.id, orderIndex: i } },
                update: { title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
                create: { conceptId: concept2.id, orderIndex: i, title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
            })
        }
        console.log(`  ✓ Seeded ${subs.length} sub-lessons into "${concept2.name}"`)
    }

    // ────────────────────────────────────────────────
    // CONCEPT 3: Present Tense (-AR Verbs)
    // ────────────────────────────────────────────────
    const concept3 = allConcepts.find(c => c.id === 'concept-present-ar')
    if (concept3) {
        const subs = [
            {
                title: 'Understand: the -AR pattern',
                icon: 'book-open',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Spanish verbs come in 3 families by their ending: -AR, -ER, -IR. The -AR family is the largest and most regular. Drop the -ar and add: -o (I), -as (you), -a (he/she), -amos (we), -áis (you all, Spain), -an (they).' },
                    { type: 'explain', text: 'The "yo" form always ends in -o. This is the easiest ending to remember and the most useful in daily conversation.' },
                    { type: 'example', es: 'Yo hablo español.', en: 'I speak Spanish.' },
                    { type: 'example', es: 'Ella trabaja en Madrid.', en: 'She works in Madrid.' },
                    { type: 'example', es: 'Nosotros estudiamos juntos.', en: 'We study together.' },
                    { type: 'vocab', items: [
                        { word: 'hablar', translation: 'to speak' },
                        { word: 'trabajar', translation: 'to work' },
                        { word: 'estudiar', translation: 'to study' },
                        { word: 'explicar', translation: 'to explain' },
                        { word: 'llevar', translation: 'to carry / to wear' },
                    ]},
                    { type: 'tip', text: 'Say "hablo, hablas, habla, hablamos, hablan" out loud. The rhythm of the endings is the same for every -AR verb you will ever learn.' },
                ],
                exercises: [
                    { type: 'fill_blank', prompt: 'Yo ___ español. (hablar)', answer: 'hablo', whyExplanation: '-AR verbs drop -ar and add -o for "yo": hablar → hablo.' },
                    { type: 'mcq', prompt: 'We work here.', options: ['Trabajamos aquí', 'Trabajan aquí'], answer: 'Trabajamos aquí', whyExplanation: '"Nosotros" (we) takes -amos: trabajar → trabajamos.' },
                    { type: 'mcq', prompt: 'She studies Spanish every day.', options: ['Ella estudia español todos los días', 'Ella estudio español todos los días'], answer: 'Ella estudia español todos los días', whyExplanation: '"Ella" form takes -a: estudiar → estudia.' },
                    { type: 'listen_choose', audio: 'Yo hablo con mi jefe.', options: ['I speak with my boss.', 'You speak with my boss.'], answer: 'I speak with my boss.', whyExplanation: '"Hablo" ends in -o, which is the "yo" (I) form.' },
                    { type: 'match', pairs: [
                        { a: 'hablo', b: 'I speak' },
                        { a: 'trabajas', b: 'you work' },
                        { a: 'estudia', b: 'he/she studies' },
                        { a: 'explicamos', b: 'we explain' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud three things you do every day, starting each sentence with "Yo..." and a -AR verb.',
                    chatSeed: 'Quiero practicar verbos -AR regulares en presente: hablo, trabajo, estudio.',
                },
            },
            {
                title: 'Hear the -AR endings',
                icon: 'ear',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Spanish drops the subject pronoun constantly. "Trabajo" alone means "I work" — you don\'t need "yo." Train your ear to identify the speaker by the ending alone.' },
                    { type: 'example', es: 'Hablo, hablas, habla, hablamos, hablan.', en: 'I speak, you speak, he/she speaks, we speak, they speak.' },
                    { type: 'example', es: '¿Trabajas hoy? — Sí, trabajo hasta las ocho.', en: '"Do you work today?" — "Yes, I work until eight."' },
                    { type: 'tip', text: 'Tap 🔊 on every example. Your ear picks up the -o/-as/-a/-amos/-an pattern faster than your eyes.' },
                ],
                exercises: [
                    { type: 'listen_choose', audio: 'Ellos trabajan mucho.', options: ['They work a lot.', 'We work a lot.', 'I work a lot.'], answer: 'They work a lot.', whyExplanation: '"Trabajan" ends in -an, the "ellos" (they) form.' },
                    { type: 'listen_choose', audio: '¿Estudias español?', options: ['Do you study Spanish?', 'Does he study Spanish?', 'Do we study Spanish?'], answer: 'Do you study Spanish?', whyExplanation: '"Estudias" ends in -as, which is the "tú" (you) form.' },
                    { type: 'listen_type', audio: 'Hablamos con la profesora.', answer: 'Hablamos con la profesora.' },
                    { type: 'mcq', prompt: '"They explain" in Spanish is…', options: ['explican', 'explicas', 'explica', 'explico'], answer: 'explican', whyExplanation: '"Ellos/ellas" form takes -an for all -AR verbs.' },
                    { type: 'listen_choose', audio: 'Trabajo desde casa los viernes.', options: ['I work from home on Fridays.', 'She works from home on Fridays.'], answer: 'I work from home on Fridays.', whyExplanation: '"Trabajo" ends in -o, so it\'s "yo" (I). "Los viernes" = on Fridays.' },
                ],
                realLife: {
                    prompt: 'Close your eyes and say the full -AR ending set out loud, no notes: -o, -as, -a, -amos, -an.',
                    chatSeed: 'Practica escuchar terminaciones -AR en presente para reconocer el sujeto sin el pronombre.',
                },
            },
            {
                title: 'Watch out: stem-changing -AR verbs',
                icon: 'alert-triangle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'A handful of common -AR verbs change their stem vowel in the yo/tú/él/ellos forms (but NOT in nosotros). These are called "boot verbs" because the changes fit inside a boot shape on the conjugation chart. Learn them as vocabulary, not as grammar.' },
                    { type: 'example', es: 'pensar → pienso, piensas, piensa, pensamos, piensan', en: 'to think: I think, you think, he thinks, we think, they think' },
                    { type: 'example', es: 'empezar → empiezo, empiezas, empieza, empezamos, empiezan', en: 'to start/begin' },
                    { type: 'example', es: 'cerrar → cierro, cierras, cierra, cerramos, cierran', en: 'to close' },
                    { type: 'vocab', items: [
                        { word: 'pensar', translation: 'to think (e→ie)' },
                        { word: 'empezar', translation: 'to start (e→ie)' },
                        { word: 'cerrar', translation: 'to close (e→ie)' },
                        { word: 'encontrar', translation: 'to find (o→ue)' },
                        { word: 'costar', translation: 'to cost (o→ue)' },
                    ]},
                    { type: 'tip', text: 'Notice: "nosotros" never changes. Pensamos, empezamos, cerramos — always regular. Only the other forms change.' },
                ],
                exercises: [
                    { type: 'mcq', prompt: 'I think it is true. (pensar)', options: ['Pienso que es verdad', 'Penso que es verdad'], answer: 'Pienso que es verdad', whyExplanation: '"Pensar" is e→ie stem-changing in the yo form: pienso, not penso.' },
                    { type: 'fill_blank', prompt: 'La clase ___ a las ocho. (empezar)', answer: 'empieza', whyExplanation: 'Empezar is e→ie in the él/ella form: empieza.' },
                    { type: 'listen_choose', audio: 'Cierro la puerta.', options: ['I close the door.', 'You close the door.', 'He closes the door.'], answer: 'I close the door.', whyExplanation: '"Cierro" ends in -o with the e→ie change — it\'s "yo" form of cerrar.' },
                    { type: 'mcq', prompt: 'We think Spanish is fun. (nosotros)', options: ['Pensamos que el español es divertido', 'Pensamos que el español es divertida'], answer: 'Pensamos que el español es divertido', whyExplanation: '"Nosotros" form is always regular — pensamos. "Español" is masculine so "divertido."' },
                    { type: 'match', pairs: [
                        { a: 'pienso', b: 'I think' },
                        { a: 'empiezas', b: 'you start' },
                        { a: 'cierra', b: 'he/she closes' },
                        { a: 'encontramos', b: 'we find' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud three opinions using "pienso que..." (I think that...) — about food, weather, and a TV show.',
                    chatSeed: 'Practica verbos -AR con cambio radical: pienso, empiezo, cierro, encuentro.',
                },
            },
            {
                title: 'Use it: describe your day with -AR verbs',
                icon: 'message-circle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Real daily routine sentences combine regular and stem-changing -AR verbs. You now have enough to describe most of your morning and workday.' },
                    { type: 'example', es: 'Pienso en el trabajo cuando empiezo el día.', en: 'I think about work when I start the day.' },
                    { type: 'example', es: 'Trabajo mucho y hablo con muchos clientes.', en: 'I work a lot and speak with many clients.' },
                ],
                exercises: [
                    { type: 'translate', prompt: 'I work in Madrid and I speak Spanish every day.', answer: 'Trabajo en Madrid y hablo español todos los días', whyExplanation: 'Both regular -AR verbs in yo form: trabajo, hablo.' },
                    { type: 'translate', prompt: 'The class starts at ten.', answer: 'La clase empieza a las diez', whyExplanation: 'Empezar is e→ie in the él/ella form: empieza.' },
                    { type: 'mcq', prompt: '"We close the store at eight" in Spanish…', options: ['Cerramos la tienda a las ocho', 'Cierran la tienda a las ocho'], answer: 'Cerramos la tienda a las ocho', whyExplanation: '"Nosotros" form of cerrar is always regular: cerramos.' },
                    { type: 'match', pairs: [
                        { a: 'Trabajo mucho', b: 'I work a lot' },
                        { a: 'Hablo español', b: 'I speak Spanish' },
                        { a: 'Empiezo temprano', b: 'I start early' },
                        { a: 'Cierro tarde', b: 'I close late' },
                    ]},
                ],
                realLife: {
                    prompt: 'Chat with Ecla for 2 minutes describing your workday in Spanish, using at least 5 different -AR verbs.',
                    chatSeed: 'Hablemos de mi rutina de trabajo en español usando verbos -AR regulares y con cambio radical.',
                },
            },
        ]

        for (let i = 0; i < subs.length; i++) {
            const s = subs[i] as any
            await prisma.subLesson.upsert({
                where: { conceptId_orderIndex: { conceptId: concept3.id, orderIndex: i } },
                update: { title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
                create: { conceptId: concept3.id, orderIndex: i, title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
            })
        }
        console.log(`  ✓ Seeded ${subs.length} sub-lessons into "${concept3.name}"`)
    }

    // ────────────────────────────────────────────────
    // CONCEPT 4: Present Tense (-ER / -IR Verbs)
    // ────────────────────────────────────────────────
    const concept4 = allConcepts.find(c => c.id === 'concept-present-er-ir')
    if (concept4) {
        const subs = [
            {
                title: 'Understand -ER / -IR verbs',
                icon: 'book-open',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Spanish verbs come in 3 families by their ending: -AR, -ER, -IR. -ER and -IR share almost the same endings in the present tense — learn them together and you get two families for the price of one.' },
                    { type: 'explain', text: 'Drop the -er/-ir, then add: -o (I), -es (you), -e (he/she), -emos/-imos (we), -en (they). Only "we" is different between the two families.' },
                    { type: 'example', es: 'Valentina come pan cada mañana.', en: 'Valentina eats bread every morning.' },
                    { type: 'example', es: 'Ella vive en Madrid con su hermana.', en: 'She lives in Madrid with her sister.' },
                    { type: 'example', es: 'Nosotros comemos juntos los domingos.', en: 'We eat together on Sundays.' },
                    { type: 'vocab', items: [
                        { word: 'comer', translation: 'to eat' },
                        { word: 'beber', translation: 'to drink' },
                        { word: 'vivir', translation: 'to live' },
                        { word: 'escribir', translation: 'to write' },
                        { word: 'leer', translation: 'to read' },
                    ]},
                    { type: 'tip', text: 'Say "comemos" and "vivimos" out loud back to back. Hear the only real difference: -emos vs -imos.' },
                ],
                exercises: [
                    { type: 'listen_choose', audio: 'Valentina come pan cada mañana.', options: ['Valentina eats bread every morning.', 'Valentina drinks water every morning.', 'Valentina lives in Madrid.'], answer: 'Valentina eats bread every morning.', whyExplanation: '"Come" is 3rd person of "comer" (to eat) — "pan" (bread) confirms it, not a drink or a location.' },
                    { type: 'mcq', prompt: 'Ella ___ en Sevilla. (vivir)', options: ['vive', 'vives', 'vivo', 'viven'], answer: 'vive', whyExplanation: '"Ella" (she) takes the -e ending: vive. "Viven" would be for "ellos/ellas" (they).' },
                    { type: 'fill_blank', prompt: 'Nosotros ___ (comer) juntos los domingos.', answer: 'comemos', whyExplanation: '-ER verbs use -emos for "we" — comer → comemos.' },
                    { type: 'fill_blank', prompt: 'Nosotros ___ (vivir) en la misma ciudad.', answer: 'vivimos', whyExplanation: '-IR verbs use -imos for "we" — vivir → vivimos. This is the ONE place -ER and -IR actually differ.' },
                    { type: 'listen_type', audio: 'Yo bebo agua todos los días.', answer: 'Yo bebo agua todos los días.' },
                    { type: 'match', pairs: [
                        { a: 'comer', b: 'to eat' },
                        { a: 'beber', b: 'to drink' },
                        { a: 'vivir', b: 'to live' },
                        { a: 'leer', b: 'to read' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say three true sentences about yourself out loud right now: "Como…", "Bebo…", "Vivo en…".',
                    chatSeed: 'Quiero practicar verbos -ER y -IR en presente hablando de mi día.',
                },
            },
            {
                title: 'Hear the endings',
                icon: 'ear',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'In fast speech, the verb ending is often the ONLY clue to who is doing the action — Spanish frequently drops the subject pronoun (yo, tú, él). Train your ear on endings and you can follow real conversation.' },
                    { type: 'example', es: 'Como, comes, come, comemos, comen.', en: 'I eat, you eat, he/she eats, we eat, they eat.' },
                    { type: 'example', es: '¿Qué bebes? — Bebo café.', en: '"What do you drink?" — "I drink coffee."' },
                    { type: 'tip', text: 'Tap 🔊 on every example below at least twice before answering. Your ear learns faster than your eyes here.' },
                ],
                exercises: [
                    { type: 'listen_choose', audio: 'Ellos viven aquí.', options: ['They live here.', 'We live here.', 'I live here.'], answer: 'They live here.', whyExplanation: '"Viven" ends in -en, the "ellos/ellas" (they) ending.' },
                    { type: 'listen_choose', audio: '¿Qué bebes?', options: ['What do you drink?', 'What do you eat?', 'Where do you live?'], answer: 'What do you drink?', whyExplanation: '"Bebes" comes from "beber" (to drink), -es ending = "tú" (you).' },
                    { type: 'listen_type', audio: 'Ella escribe una carta.', answer: 'Ella escribe una carta.' },
                    { type: 'mcq', prompt: '"They eat" in Spanish is…', options: ['comen', 'comes', 'come', 'como'], answer: 'comen', whyExplanation: '-en is the "they" ending for both -ER and -IR verbs.' },
                    { type: 'listen_choose', audio: 'Leemos el periódico por la mañana.', options: ['We read the newspaper in the morning.', 'I read the newspaper in the morning.', 'They read the newspaper in the morning.'], answer: 'We read the newspaper in the morning.', whyExplanation: '"Leemos" — -emos ending confirms "nosotros" (we).' },
                ],
                realLife: {
                    prompt: 'Close your eyes and say the full -ER ending set out loud, no notes: -o, -es, -e, -emos, -en.',
                    chatSeed: 'Dime frases cortas con verbos -ER y -IR para practicar el oído.',
                },
            },
            {
                title: 'Watch out: irregular "yo" forms',
                icon: 'alert-triangle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'A handful of everyday -ER/-IR verbs break the pattern ONLY in the "yo" (I) form. You will hear and need these constantly, so learn them as exceptions now instead of getting confused later.' },
                    { type: 'example', es: 'Tengo un hermano. (not "teno")', en: 'I have a brother.' },
                    { type: 'example', es: 'Salgo de casa a las ocho.', en: 'I leave home at eight.' },
                    { type: 'example', es: 'Hago la tarea por la noche.', en: 'I do homework at night.' },
                    { type: 'vocab', items: [
                        { word: 'tengo (tener)', translation: 'I have' },
                        { word: 'salgo (salir)', translation: 'I leave / go out' },
                        { word: 'hago (hacer)', translation: 'I do / make' },
                        { word: 'pongo (poner)', translation: 'I put' },
                    ]},
                    { type: 'tip', text: 'Notice the pattern within the exception: tengo, salgo, hago, pongo all end in -go. Every other form (tú, él, nosotros...) follows the regular pattern you already know.' },
                ],
                exercises: [
                    { type: 'mcq', prompt: 'Yo ___ un perro y un gato. (tener)', options: ['tengo', 'teno', 'tiene', 'tienes'], answer: 'tengo', whyExplanation: '"Tener" is irregular only in "yo": tengo. Everywhere else it follows the normal -ER pattern with a small vowel change (tienes, tiene).' },
                    { type: 'fill_blank', prompt: 'Yo ___ (salir) de casa muy temprano.', answer: 'salgo', whyExplanation: 'Salir → salgo in "yo" only. Tú sales, él sale, follows the regular pattern.' },
                    { type: 'listen_choose', audio: 'Hago la tarea antes de cenar.', options: ['I do homework before dinner.', 'You do homework before dinner.', 'She does homework before dinner.'], answer: 'I do homework before dinner.', whyExplanation: '"Hago" is unmistakably "yo" (I) — it is the exception form, so it only ever means "I do/make."' },
                    { type: 'match', pairs: [
                        { a: 'tengo', b: 'I have' },
                        { a: 'salgo', b: 'I leave' },
                        { a: 'hago', b: 'I do/make' },
                        { a: 'pongo', b: 'I put' },
                    ]},
                ],
                realLife: {
                    prompt: 'Say out loud: what you have (tengo…), what time you leave home (salgo a las…), and one thing you do every day (hago…).',
                    chatSeed: 'Quiero practicar los verbos irregulares tengo, salgo y hago hablando de mi rutina.',
                },
            },
            {
                title: 'Use it: talk about your day',
                icon: 'message-circle',
                xpReward: 5,
                teach: [
                    { type: 'explain', text: 'Real sentences follow: subject (optional) + verb + detail. You now have enough regular AND irregular verbs to describe a full normal day.' },
                    { type: 'example', es: 'Vivo con mi familia y tengo dos hermanos.', en: 'I live with my family and I have two siblings.' },
                    { type: 'example', es: 'Salgo a las ocho, como a la una, y escribo mensajes todo el día.', en: 'I leave at eight, eat at one, and write messages all day.' },
                ],
                exercises: [
                    { type: 'translate', prompt: 'I live in Madrid and I have a dog.', answer: 'Vivo en Madrid y tengo un perro.', whyExplanation: 'Combines a regular -IR verb (vivo) with the irregular yo-form (tengo) — this is exactly how natives actually talk.' },
                    { type: 'translate', prompt: 'I eat breakfast at eight and I leave at nine.', answer: 'Como el desayuno a las ocho y salgo a las nueve.', whyExplanation: 'Two verbs, two different patterns (como = regular, salgo = irregular) in one natural sentence.' },
                    { type: 'mcq', prompt: '"We write" in Spanish is…', options: ['escribimos', 'escriben', 'escribes', 'escribo'], answer: 'escribimos', whyExplanation: '-IR verbs take -imos for "nosotros" — escribir → escribimos.' },
                    { type: 'match', pairs: [
                        { a: 'Yo como', b: 'I eat' },
                        { a: 'Ella vive', b: 'She lives' },
                        { a: 'Ellos beben', b: 'They drink' },
                        { a: 'Yo tengo', b: 'I have' },
                    ]},
                ],
                realLife: {
                    prompt: 'Chat with Ecla for 2 minutes, in Spanish, describing your actual daily routine start to finish.',
                    chatSeed: 'Hablemos de mi rutina diaria en español, usando verbos -ER, -IR y tengo/salgo/hago.',
                },
            },
        ]

        for (let i = 0; i < subs.length; i++) {
            const s = subs[i] as any
            await prisma.subLesson.upsert({
                where: { conceptId_orderIndex: { conceptId: concept4.id, orderIndex: i } },
                update: { title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
                create: { conceptId: concept4.id, orderIndex: i, title: s.title, icon: s.icon, xpReward: s.xpReward, teach: s.teach, exercises: s.exercises, realLife: s.realLife },
            })
        }
        console.log(`  ✓ Seeded ${subs.length} sub-lessons into "${concept4.name}"`)
    }

    console.log('\nAll sub-lessons seeded successfully!')
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })