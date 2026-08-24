/**
 * Scene Archetypes — the pedagogy layer.
 * Each archetype turns curriculum targets + a blueprint's creative direction
 * into a full 9-stage beat ladder. Language ALWAYS comes from the Target;
 * the archetype decides HOW it is experienced (hear → infer → recognize →
 * retrieve → produce → interact → transfer), never WHAT is taught.
 */
import type { ChallengeSpec, SceneBeat, SceneOption } from '@/lib/sceneTypes'
import type { SceneBlueprint } from '@/lib/blueprint'

export type Target = {
    words: { word: string; translation?: string }[]
    patterns: string[]
    examples: string[]
    grammar?: string
    pronunciation?: string
    culture?: string
}

export type Ctx = {
    bp: SceneBlueprint
    t: Target
    gloss: (w: string) => string | undefined
    main: SceneBlueprint['characters'][0]
    other: SceneBlueprint['characters'][1]
}

const norm = (s: string) => s.toLowerCase().replace(/[¡!.,¿?]/g, '').trim()
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const splitList = (s?: string) => (s ?? '').split(',').map(x => x.trim()).filter(Boolean)
const w = (ctx: Ctx, i: number) => {
    const fromWords = ctx.t.words[i]
    if (fromWords?.word?.trim()) return fromWords
    const fbWord = ctx.t.examples[i] ?? ctx.t.patterns[i] ?? ''
    return { word: fbWord.replace(/\.$/, ''), translation: undefined }
}

function listens(ctx: Ctx, items: { es: string; gloss?: string }[], intro: string): SceneBeat[] {
    return [
        { kind: 'action', stage: 'NOTICE', text: intro },
        ...items.map(i => ({ kind: 'listen', stage: 'NOTICE', character: ctx.main, es: i.es, gloss: i.gloss } as SceneBeat)),
    ]
}

function challengeOf(ctx: Ctx, fb: ChallengeSpec): ChallengeSpec {
    const c = ctx.bp.challenge
    return c ? { character: ctx.main, es: c.es, prompt: c.prompt, expected: c.expected, accept: c.expected.map(norm), hints: c.expected, replyOnSuccess: '¡Muy bien!' } : fb
}

/* ── DISCOVERY · sounds & patterns (Unit 1, Scene 01-02 style) ── */
export function discovery(ctx: Ctx): SceneBeat[] {
    const { t, bp } = ctx
    const vowels = splitList(t.patterns[0])
    const syllables = splitList(t.patterns[1])
    const mesa = t.examples[1] ?? 'mesa', mi = t.examples[2] ?? 'mi', musica = t.examples[3] ?? 'música'
    const me = syllables[1] ?? 'me'
    const SOUND: Record<string, string> = {
        a: 'ah — short, as in "father"', e: 'eh — as in "met"', i: 'ee — as in "see"',
        o: 'oh — pure', u: 'oo — as in "moon"', ma: 'mah', me: 'meh', mi: 'mee', mo: 'moh', mu: 'moo',
    }
    return [
        { kind: 'action', stage: 'ENCOUNTER', text: bp.enter },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: musica, gloss: ctx.gloss(musica) ?? 'music' },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: mesa, gloss: ctx.gloss(mesa) ?? 'table' },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: mi, gloss: ctx.gloss(mi) ?? 'my' },
        { kind: 'choice', stage: 'UNDERSTAND', prompt: bp.understandPrompt, coach: bp.understandCoach ?? t.pronunciation, options: bp.understandOptions ?? [
            { label: 'Always keeps the same short sound', correct: true },
            { label: 'Changes like the English "a"' }, { label: 'Is silent' }] },
        ...listens(ctx, [...vowels, ...syllables].map(v => ({ es: v, gloss: SOUND[norm(v)] })), 'Five vowels. Five stable sounds. Tap each one.'),
        { kind: 'listen', stage: 'RECOGNIZE', character: ctx.main, es: mi },
        { kind: 'choice', stage: 'RECOGNIZE', prompt: 'Which word did you hear?', coach: `"${mi}" ends in "ee". "${me}" ends in "eh".`, options: [{ label: mi, correct: true }, { label: me }] },
        { kind: 'listen', stage: 'RECOGNIZE', character: ctx.main, es: musica },
        { kind: 'choice', stage: 'RECOGNIZE', prompt: 'And now, which word?', coach: `${musica} — three vowels in a row.`, options: [{ label: musica, correct: true }, { label: mesa }, { label: mi }] },
        { kind: 'speak', stage: 'RETRIEVE', prompt: `Without listening first: say "${ctx.gloss(mesa) ?? 'table'}" in Spanish.`, expected: [mesa], accept: [norm(mesa)], hints: ['Starts with "m"…', mesa], replyOnSuccess: '¡Eso es!' },
        { kind: 'speak', stage: 'PRODUCE', prompt: bp.producePrompt ?? `Now say "${ctx.gloss(mi) ?? 'my'} ${ctx.gloss(musica) ?? 'music'}".`, expected: [`${mi} ${musica}`], accept: [`${norm(mi)} ${norm(musica)}`], hints: [`${mi} …`, `${mi} ${musica}`], replyOnSuccess: '¡Muy bien!' },
        { kind: 'transfer-intro', stage: 'TRANSFER', text: 'A brand-new word. You have never seen it. Trust the code.', setting: bp.transferSetting },
        { kind: 'listen', stage: 'TRANSFER', character: ctx.main, es: 'moto' },
        { kind: 'choice', stage: 'TRANSFER', prompt: '"Moto" — which vowels did you hear?', coach: 'O stays O. You just decoded a new word.', options: [{ label: 'o and o', correct: true }, { label: 'a and o' }, { label: 'u and o' }] },
        { kind: 'action', stage: 'RETAIN', text: bp.retain },
    ]
}

/* ── ENCOUNTER · instructions & first contact with the language ── */
export function encounter(ctx: Ctx): SceneBeat[] {
    const { bp } = ctx
    const escucha = w(ctx, 0), mira = w(ctx, 1), repite = w(ctx, 2), lee = w(ctx, 3)
    return [
        { kind: 'action', stage: 'ENCOUNTER', text: bp.enter },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: cap(escucha.word), gloss: cap(escucha.translation) },
        { kind: 'choice', stage: 'UNDERSTAND', prompt: bp.understandPrompt, coach: bp.understandCoach ?? `${cap(escucha.word)} = ${escucha.translation}.`, options: bp.understandOptions ?? [
            { label: cap(escucha.translation ?? 'Listen'), correct: true }, { label: 'Speak' }, { label: 'Write' }] },
        ...listens(ctx, [escucha, mira, repite, lee].map(x => ({ es: x.word, gloss: x.translation })), 'Four instructions run every practice. Tap each one.'),
        { kind: 'listen', stage: 'RECOGNIZE', character: ctx.main, es: repite.word },
        { kind: 'choice', stage: 'RECOGNIZE', prompt: `You just heard "${cap(repite.word)}". It means…`, coach: `${cap(repite.word)} = ${repite.translation}.`, options: [
            { label: cap(repite.translation ?? 'Repeat'), correct: true }, { label: cap(mira.translation ?? 'Look') }, { label: cap(lee.translation ?? 'Read') }] },
        { kind: 'speak', stage: 'RETRIEVE', prompt: `Say the instruction for "${escucha.translation}".`, expected: [escucha.word], accept: [norm(escucha.word)], hints: ['Es…', escucha.word], replyOnSuccess: '¡Eso es!' },
        { kind: 'speak', stage: 'PRODUCE', prompt: bp.producePrompt ?? `Follow her: "${cap(repite.word)}: hola."`, npcLine: `${cap(repite.word)}: hola.`, expected: ['hola'], accept: ['ola'], hints: ['Just the word…', 'hola'], replyOnSuccess: 'Perfecto.',
            challenge: challengeOf(ctx, { character: ctx.main, es: `${cap(lee.word)}: buenas tardes.`, prompt: 'Now read the afternoon greeting.', expected: ['buenas tardes'], accept: ['buenas tardes'], hints: ['buenas tardes'], replyOnSuccess: '¡Muy bien!' }) },
        { kind: 'speak', stage: 'INTERACT', prompt: ctx.bp.interactPrompt ?? 'She wants you to look. Say it.', npcLine: cap(mira.word), expected: [mira.word], accept: [norm(mira.word)], hints: [mira.word], replyOnSuccess: '¡Sí!' },
        { kind: 'transfer-intro', stage: 'TRANSFER', text: 'New voice, same instructions.', setting: bp.transferSetting },
        { kind: 'say', stage: 'TRANSFER', character: ctx.other, es: `${cap(lee.word)}, por favor.`, gloss: `${lee.translation}, please.` },
        { kind: 'speak', stage: 'TRANSFER', prompt: bp.transferPrompt, npcLine: `${cap(lee.word)}, por favor.`, expected: ['hola', 'buenos días', 'buenas tardes'], accept: ['ola', 'buenos dias', 'buenas tardes'], open: true, hints: [], replyOnSuccess: '¡Muy bien!' },
        { kind: 'action', stage: 'RETAIN', text: bp.retain },
    ]
}

/* ── CONVERSATION · greetings & goodbyes ── */
export function conversation(ctx: Ctx): SceneBeat[] {
    const { t, bp } = ctx
    const g0 = w(ctx, 0), g1 = w(ctx, 1), g2 = w(ctx, 2), g3 = w(ctx, 3)
    return [
        { kind: 'action', stage: 'ENCOUNTER', text: bp.enter },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: `${cap(g0.word)} ${g1.word}.`, gloss: `${g0.translation} — ${g1.translation}` },
        { kind: 'choice', stage: 'UNDERSTAND', prompt: bp.understandPrompt, coach: bp.understandCoach ?? t.culture, options: bp.understandOptions ?? [
            { label: 'Greeting you', correct: true }, { label: 'Saying goodbye' }, { label: 'Asking for your order' }] },
        ...listens(ctx, [g0, g1, g2, g3].map(x => ({ es: cap(x.word), gloss: x.translation })), 'Four small words carry almost every encounter. Tap each.'),
        { kind: 'listen', stage: 'RECOGNIZE', character: ctx.main, es: cap(g2.word) },
        { kind: 'choice', stage: 'RECOGNIZE', prompt: `You heard "${cap(g2.word)}". What does it mean?`, coach: `${cap(g2.word)} = ${g2.translation}.`, options: [
            { label: cap(g2.translation ?? 'Good afternoon'), correct: true }, { label: g1.translation ?? 'Good morning' }, { label: 'Goodbye' }] },
        { kind: 'speak', stage: 'RETRIEVE', prompt: `How do you say "${g1.translation}"?`, expected: [g1.word], accept: [norm(g1.word)], hints: [`${g1.word.split(' ')[0]}…`, g1.word], replyOnSuccess: '¡Muy bien!' },
        { kind: 'speak', stage: 'PRODUCE', prompt: bp.producePrompt ?? `It\u2019s morning. Greet her back: ${cap(g0.word)} + ${g1.word}.`, npcLine: `${cap(g0.word)} ${g1.word}.`, expected: [g0.word, g1.word, `${g0.word}, ${g1.word}`], accept: [norm(g0.word), norm(g1.word)], hints: ['Start with a greeting…', `${cap(g0.word)} + ${g1.word}`], replyOnSuccess: '¡Muy bien! Pasa, pasa.',
            challenge: challengeOf(ctx, { character: ctx.main, es: `${cap(g2.word)}!`, prompt: 'Later that day, she sees you again.', expected: [g2.word], accept: [norm(g2.word)], hints: [cap(g2.word)], replyOnSuccess: '¡Hasta luego!' }) },
        { kind: 'choice', stage: 'INTERACT', prompt: bp.interactPrompt ?? 'It\u2019s 21:30 now. Which one fits this hour?', coach: `Now: ${cap(g3.word)} (${g3.translation}).`, options: [
            { label: cap(g3.word), correct: true }, { label: cap(g1.word) }, { label: cap(g2.word) }] },
        { kind: 'speak', stage: 'INTERACT', prompt: 'Say it to her.', npcLine: cap(g3.word), expected: [g3.word, `${g0.word}, ${g3.word}`], accept: [norm(g3.word)], hints: [cap(g3.word)], replyOnSuccess: '¡Hasta mañana!' },
        { kind: 'transfer-intro', stage: 'TRANSFER', text: 'Same ability. New person. New hour.', setting: bp.transferSetting },
        { kind: 'say', stage: 'TRANSFER', character: ctx.other, es: `${cap(g0.word)} ${g2.word}.`, gloss: `${g0.translation} — ${g2.translation}` },
        { kind: 'speak', stage: 'TRANSFER', prompt: bp.transferPrompt, npcLine: `${cap(g0.word)} ${g2.word}.`, expected: [g0.word, g2.word], accept: [norm(g0.word), norm(g2.word)], open: true, hints: [], replyOnSuccess: '¡Hasta luego!' },
        { kind: 'action', stage: 'RETAIN', text: bp.retain },
    ]
}

/* ── TRANSACTION · requests & politeness ── */
export function transaction(ctx: Ctx): SceneBeat[] {
    const { bp } = ctx
    const porFavor = w(ctx, 0), gracias = w(ctx, 1), muchas = w(ctx, 2), perdon = w(ctx, 3)
    return [
        { kind: 'action', stage: 'ENCOUNTER', text: bp.enter },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: 'Un café.', gloss: 'A coffee.' },
        { kind: 'say', stage: 'ENCOUNTER', character: ctx.main, es: cap(porFavor.word), gloss: porFavor.translation },
        { kind: 'choice', stage: 'UNDERSTAND', prompt: bp.understandPrompt, coach: bp.understandCoach ?? `${cap(porFavor.word)} = ${porFavor.translation}. Small words make requests polite.`, options: bp.understandOptions ?? [
            { label: 'Making the request polite', correct: true }, { label: 'Ordering two coffees' }, { label: 'Saying goodbye' }] },
        ...listens(ctx, [porFavor, gracias, muchas, perdon].map(x => ({ es: cap(x.word), gloss: x.translation })), 'Three small kindnesses. Tap each.'),
        { kind: 'listen', stage: 'RECOGNIZE', character: ctx.main, es: cap(gracias.word) },
        { kind: 'choice', stage: 'RECOGNIZE', prompt: `You heard "${cap(gracias.word)}". It means…`, coach: `${cap(gracias.word)} = ${gracias.translation}.`, options: [
            { label: cap(gracias.translation ?? 'Thank you'), correct: true }, { label: cap(porFavor.translation ?? 'Please') }, { label: 'Sorry' }] },
        { kind: 'speak', stage: 'RETRIEVE', prompt: `She gave you the coffee. Say "${gracias.translation}".`, expected: [gracias.word], accept: [norm(gracias.word)], hints: ['Gra…', gracias.word], replyOnSuccess: 'De nada.' },
        { kind: 'speak', stage: 'PRODUCE', prompt: bp.producePrompt ?? 'Ask for water — politely.', npcLine: '¿Algo más?', expected: ['agua, por favor', 'un agua, por favor'], accept: ['agua por favor', 'un agua'], hints: ['…por favor', `agua, ${porFavor.word}`], replyOnSuccess: 'Claro que sí.' },
        { kind: 'speak', stage: 'INTERACT', prompt: 'You bumped her tray. Say it.', npcLine: '¡Uy!', expected: [perdon.word], accept: [norm(perdon.word)], hints: ['Per…', perdon.word], replyOnSuccess: 'No pasa nada.' },
        { kind: 'transfer-intro', stage: 'TRANSFER', text: 'New person. Same kindness.', setting: bp.transferSetting },
        { kind: 'say', stage: 'TRANSFER', character: ctx.other, es: 'Pasa.', gloss: 'Go ahead.' },
        { kind: 'speak', stage: 'TRANSFER', prompt: bp.transferPrompt, npcLine: 'Pasa.', expected: [muchas.word, gracias.word], accept: [norm(muchas.word), norm(gracias.word)], open: true, hints: [], replyOnSuccess: '¡Hasta luego!' },
        { kind: 'action', stage: 'RETAIN', text: bp.retain },
    ]
}

export const ARCHETYPES: Record<string, (ctx: Ctx) => SceneBeat[]> = {
    discovery, encounter, conversation, transaction,
}