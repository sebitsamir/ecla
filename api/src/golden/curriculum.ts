import { definitionSchema, EVALUATOR_VERSION, type DefinedStep, type GoldenDefinition } from './definition'

const audio = { status: 'tts_fallback' as const, locale: 'es-ES', rate: 0.9 }
const repair = ['¿Puedes repetir?', 'Puedes repetir por favor', 'Otra vez por favor', 'Más despacio por favor', 'No entiendo', '¿Puede repetir?', '¿Puedes hablar más despacio?']
const step = (value: Omit<DefinedStep, 'audio' | 'repair'> & Partial<Pick<DefinedStep, 'audio' | 'repair'>>): DefinedStep => ({ audio, repair: false, ...value })
const context = (title: string, setting: string, contextFingerprint: string, purpose: GoldenDefinition['purpose'], steps: DefinedStep[]): GoldenDefinition => definitionSchema.parse({
    contract: 'golden-greeting/1', competencyCode: 'PA1.SOC.GRT.01', title, setting, contextFingerprint, purpose,
    evaluatorVersion: EVALUATOR_VERSION,
    culturalNote: 'Hola is widely understood. Time-of-day boundaries and the informal Buenas vary by region. This pilot accepts appropriate greetings without requiring a particular accent.',
    steps,
})

// These are authored software-pilot drafts, not educator/native-speaker approvals.
// Each stable context has a different social purpose, speaker and time cue.
export const GOLDEN_SCENES = [
    { slug: 'greeting-neighbor-morning', definition: context('A neighbor at the door', 'Madrid · apartment doorway · morning', 'neighbor-door-morning', 'practice', [
        step({ id: 'encounter', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'You are leaving home. Marta holds the door and greets you.', speaker: 'Marta', line: '¡Hola! Buenos días.', translation: 'Hello! Good morning.', accepted: [], dimension: null, model: 'Hola. Buenos días.' }),
        step({ id: 'meaning', stage: 'UNDERSTAND', kind: 'choice', prompt: 'What is Marta doing?', options: [{ id: 'goodbye', label: 'Saying goodbye' }, { id: 'greeting', label: 'Greeting you' }, { id: 'price', label: 'Asking a price' }], accepted: ['greeting'], dimension: 'comprehension', model: 'She is greeting you.' }),
        step({ id: 'notice', stage: 'NOTICE', kind: 'encounter', prompt: 'Listen once at a slower pace. The greeting matches the morning.', speaker: 'Marta', line: 'Buenos días.', audio: { ...audio, rate: 0.7 }, accepted: [], dimension: null, model: 'Buenos días.' }),
        step({ id: 'recognize', stage: 'RECOGNIZE', kind: 'choice', prompt: 'Choose a greeting for this morning.', options: [{ id: 'night', label: 'Buenas noches.' }, { id: 'morning', label: 'Buenos días.' }, { id: 'thanks', label: 'Gracias.' }], accepted: ['morning'], dimension: 'comprehension', model: 'Buenos días.' }),
        step({ id: 'retrieve', stage: 'RETRIEVE', kind: 'response', prompt: 'Without looking back, greet Marta for the morning.', accepted: ['Buenos días', 'Hola buenos días'], dimension: 'retrieval', model: 'Buenos días.' }),
        step({ id: 'produce', stage: 'PRODUCE', kind: 'response', prompt: 'A second neighbor arrives. Give a friendly greeting.', accepted: ['Hola', 'Buenos días', 'Hola buenos días', 'Buenas'], dimension: 'production', model: 'Hola.' }),
        step({ id: 'repair', stage: 'INTERACT', kind: 'response', prompt: 'Marta speaks too quickly. Ask her to repeat or slow down.', speaker: 'Marta', line: '¡Buenas! ¿Todo bien por aquí?', accepted: repair, dimension: 'interaction', repair: true, model: '¿Puedes repetir, por favor?' }),
        step({ id: 'reply', stage: 'INTERACT', kind: 'response', prompt: 'She repeats the greeting slowly. Greet her back.', speaker: 'Marta', line: 'Hola.', accepted: ['Hola', 'Buenos días', 'Hola buenos días', 'Buenas'], dimension: 'interaction', model: 'Hola.' }),
    ]) },
    { slug: 'greeting-cafe-afternoon', definition: context('Arriving at a café', 'Bogotá · neighborhood café · afternoon', 'cafe-arrival-afternoon', 'practice', [
        step({ id: 'encounter', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'You reach the café counter. Greet Daniel before ordering.', speaker: 'Daniel', line: 'Buenas tardes. Bienvenido.', translation: 'Good afternoon. Welcome.', accepted: [], dimension: null, model: 'Buenas tardes.' }),
        step({ id: 'meaning', stage: 'UNDERSTAND', kind: 'choice', prompt: 'What part of the day is named in the greeting?', options: [{ id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Afternoon' }, { id: 'night', label: 'Night' }], accepted: ['afternoon'], dimension: 'comprehension', model: 'Tardes means afternoons.' }),
        step({ id: 'variation', stage: 'NOTICE', kind: 'encounter', prompt: 'A regular customer uses a shorter, informal greeting. Listen at a natural pace.', speaker: 'Lucía', line: '¡Buenas!', audio: { ...audio, locale: 'es-CO', rate: 1 }, accepted: [], dimension: null, model: 'Buenas.' }),
        step({ id: 'retrieve', stage: 'RETRIEVE', kind: 'response', prompt: 'Recall the full afternoon greeting.', accepted: ['Buenas tardes', 'Hola buenas tardes'], dimension: 'retrieval', model: 'Buenas tardes.' }),
        step({ id: 'produce', stage: 'PRODUCE', kind: 'response', prompt: 'Greet Daniel before ordering. A general greeting is also fine.', accepted: ['Hola', 'Buenas', 'Buenas tardes', 'Hola buenas tardes'], dimension: 'production', model: 'Hola. Buenas tardes.' }),
        step({ id: 'repair', stage: 'INTERACT', kind: 'response', prompt: 'The grinder drowns out the greeting. Ask Daniel to repeat.', accepted: repair, dimension: 'interaction', repair: true, model: '¿Puedes repetir?' }),
        step({ id: 'reply', stage: 'INTERACT', kind: 'response', prompt: 'Daniel repeats. Respond with a greeting.', speaker: 'Daniel', line: '¡Buenas tardes!', accepted: ['Hola', 'Buenas', 'Buenas tardes', 'Hola buenas tardes'], dimension: 'interaction', model: 'Buenas tardes.' }),
    ]) },
    { slug: 'greeting-class-evening', definition: context('Meeting your evening class', 'Mexico City · community classroom · evening', 'class-arrival-evening', 'practice', [
        step({ id: 'encounter', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'You arrive at an evening class after sunset. Ana welcomes you.', speaker: 'Ana', line: 'Hola. Buenas noches.', translation: 'Hello. Good evening.', audio: { ...audio, locale: 'es-MX' }, accepted: [], dimension: null, model: 'Buenas noches.' }),
        step({ id: 'meaning', stage: 'UNDERSTAND', kind: 'choice', prompt: 'In this arrival scene, does Buenas noches mean you must leave?', options: [{ id: 'leave', label: 'Yes: it can only mean goodbye' }, { id: 'greet', label: 'No: it can greet someone in the evening' }], accepted: ['greet'], dimension: 'comprehension', model: 'It can be a greeting on arrival in the evening.' }),
        step({ id: 'listen', stage: 'NOTICE', kind: 'encounter', prompt: 'Listen to the greeting at a slower pace.', speaker: 'Ana', line: 'Buenas noches.', audio: { ...audio, locale: 'es-MX', rate: 0.7 }, accepted: [], dimension: null, model: 'Buenas noches.' }),
        step({ id: 'retrieve', stage: 'RETRIEVE', kind: 'response', prompt: 'Recall the evening greeting without a model.', accepted: ['Buenas noches', 'Hola buenas noches'], dimension: 'retrieval', model: 'Buenas noches.' }),
        step({ id: 'produce', stage: 'PRODUCE', kind: 'response', prompt: 'Greet a new classmate as you sit down.', accepted: ['Hola', 'Buenas', 'Buenas noches', 'Hola buenas noches'], dimension: 'production', model: 'Hola.' }),
        step({ id: 'repair', stage: 'INTERACT', kind: 'response', prompt: 'The classmate greets you quietly and you miss it. Ask for repetition.', accepted: repair, dimension: 'interaction', repair: true, model: '¿Puedes repetir?' }),
        step({ id: 'reply', stage: 'INTERACT', kind: 'response', prompt: 'They repeat. Greet them back.', speaker: 'Luis', line: 'Buenas noches.', accepted: ['Hola', 'Buenas', 'Buenas noches', 'Hola buenas noches'], dimension: 'interaction', model: 'Buenas noches.' }),
    ]) },
    ...[
        { slug: 'greeting-hotel-transfer', title: 'An unfamiliar reception desk', setting: 'Seville · hotel reception · late evening', fingerprint: 'hotel-reception-evening', greeting: 'Buenas noches', person: 'Receptionist' },
        { slug: 'greeting-library-transfer', title: 'A new library', setting: 'Lima · library desk · early morning', fingerprint: 'library-desk-morning', greeting: 'Buenos días', person: 'Librarian' },
    ].map(scene => ({ slug: scene.slug, definition: context(scene.title, scene.setting, scene.fingerprint, 'transfer', [
        step({ id: 'greet', stage: 'TRANSFER', kind: 'response', prompt: `You need to speak to the ${scene.person.toLowerCase()}. Open with a greeting appropriate to the setting.`, accepted: ['Hola', 'Buenas', scene.greeting, `Hola ${scene.greeting}`], dimension: 'transfer', model: scene.greeting }),
        step({ id: 'specific', stage: 'TRANSFER', kind: 'response', prompt: 'Now use the full greeting for this time of day.', accepted: [scene.greeting, `Hola ${scene.greeting}`], dimension: 'production', model: scene.greeting }),
        step({ id: 'repair', stage: 'INTERACT', kind: 'response', prompt: 'You miss the reply. Ask the person to repeat or slow down.', accepted: repair, dimension: 'interaction', repair: true, model: '¿Puede repetir, por favor?' }),
    ]) })),
    { slug: 'greeting-delayed-retrieval', definition: context('A greeting after a day away', 'A different neighborhood · morning', 'delayed-neighborhood-morning', 'retention', [
        step({ id: 'recall', stage: 'RETAIN', kind: 'response', prompt: 'It is morning. Recall the full greeting without help.', accepted: ['Buenos días', 'Hola buenos días'], dimension: 'retention', model: 'Buenos días.' }),
        step({ id: 'retrieve', stage: 'RETRIEVE', kind: 'response', prompt: 'Later that day, it is afternoon. Recall the full greeting.', accepted: ['Buenas tardes', 'Hola buenas tardes'], dimension: 'retrieval', model: 'Buenas tardes.' }),
        step({ id: 'repair', stage: 'INTERACT', kind: 'response', prompt: 'Someone replies too quickly. Ask for repetition.', accepted: repair, dimension: 'interaction', repair: true, model: '¿Puedes repetir?' }),
    ]) },
]
