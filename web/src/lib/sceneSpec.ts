/**
 * sceneSpec — Phase 6 spec builder.
 *
 * Turns curriculum truth (engine payload + assessment contract + blueprint
 * creative direction) into the eight first-class SceneSpec sections.
 * Language text comes ONLY from the DB payload; character voice and world
 * objects are creative direction defaults keyed by stable IDs.
 */
import type { SceneBlueprint } from '@/lib/blueprint'
import { extractEngine } from '@/lib/lessonPayload'
import type {
    CharacterId, SceneCharacterSpec, SceneChallengeSpec, SceneEvidenceRequirements,
    ScenePurpose, SceneSpec, SceneSupportPolicy, SceneTargetLanguage,
    SceneWorld, SupportLevel,
} from '@/lib/sceneTypes'

/** Character voice = creative direction (people, not mascots). */
const VOICE: Record<string, { register: string; relationship: string }> = {
    sofia:  { register: 'warm, unhurried',     relationship: 'the barista who actually listens' },
    marta:  { register: 'brisk, kind',         relationship: 'the neighbor who knows the street' },
    daniel: { register: 'casual, quick',       relationship: 'a classmate between classes' },
    luis:   { register: 'polite, clear',       relationship: 'the shopkeeper on the corner' },
    ana:    { register: 'patient, precise',    relationship: 'the receptionist at the front desk' },
    you:    { register: 'learner Spanish',     relationship: 'you' },
}

/** World props ground the moment without hardcoding language. */
const WORLD_OBJECTS: Record<string, string[]> = {
    cafe:   ['the counter', 'espresso machine', 'a handwritten menu', 'two stools'],
    street: ['a street kiosk', 'shop signs', 'a bus stop', 'evening light'],
    shop:   ['a small counter', 'a card reader', 'shelves of staples'],
    home:   ['a shared kitchen table', 'a kettle', 'the door to the street'],
    hotel:  ['a reception desk', 'a key tray', 'a quiet lobby'],
    office: ['a meeting table', 'a badge reader', 'a glass door'],
}

const TIME: Record<string, string> = {
    morning: '9:42', afternoon: '16:10', evening: '19:30', night: '22:05',
}

export type SceneSpecSections = Pick<SceneSpec,
    'world' | 'characters' | 'purpose' | 'targetLanguage' | 'support' | 'challenge' | 'evidenceRequirements'>

export function buildSceneSpecSections(bp: SceneBlueprint, lesson: any): SceneSpecSections {
    const engine = extractEngine(lesson)
    const stages = engine?.subLessons ?? []
    const act = (stage: string, type: string) =>
        stages.find(s => s.stage === stage)?.activities.find(a => a.type === type)

    // ── WORLD ──
    const world: SceneWorld = {
        location: bp.environment,
        atmosphere:
            bp.mood === 'busy' ? 'a busy, lived-in moment'
                : bp.mood === 'quiet' ? 'a quiet, low-pressure moment'
                    : 'a warm, lived-in moment',
        objects: WORLD_OBJECTS[bp.environment] ?? ['the street', 'a doorway', 'passing light'],
        time: TIME[bp.timeOfDay ?? 'morning'] ?? '9:42',
    }

    // ── CHARACTERS ──
    const characters: SceneCharacterSpec[] = (bp.characters ?? [])
        .filter((c: CharacterId) => c !== 'you')
        .map((c: CharacterId, i: number) => ({
            id: c,
            role: (i === 0 ? 'primary' : 'secondary') as 'primary' | 'secondary',
            relationship: VOICE[c]?.relationship ?? 'someone with a reason to talk',
            register: VOICE[c]?.register ?? 'natural, beginner-friendly',
        }))
    characters.push({ id: 'you', role: 'learner', relationship: 'you', register: 'learner Spanish' })

    // ── PURPOSE ─
    const canDo = String(lesson?.canDo ?? bp.title ?? '')
    const scenario = String((act('ENCOUNTER', 'context')?.input as any)?.scenario ?? '')
    const purpose: ScenePurpose = {
        canDo,
        goal: canDo,
        stakes: scenario || `A real moment where you need to ${canDo.toLowerCase()}.`,
    }

    // ── TARGET LANGUAGE ──
    const lt = (engine?.languageTargets ?? {}) as any
    const toolsVocab = Array.isArray(lesson?.tools?.vocabulary) ? lesson.tools.vocabulary : []
    const targetLanguage: SceneTargetLanguage = {
        functions: [canDo],
        patterns: Array.isArray(lt.patterns) ? lt.patterns.slice(0, 6) : [],
        vocabulary: toolsVocab.length
            ? toolsVocab.map((v: any) => ({
                word: String(v.word ?? ''),
                translation: v.translation ? String(v.translation) : undefined,
            }))
            : (Array.isArray(lt.vocabulary)
                ? lt.vocabulary.slice(0, 8).map((w: string) => ({ word: String(w) }))
                : []),
        pronunciation: typeof lt.pronunciation === 'string' ? lt.pronunciation : undefined,
        culture: typeof lt.culture === 'string' ? lt.culture : undefined,
    }

    // ── SUPPORT (the engine's per-stage ladder, from the DB) ──
    const ladder = stages
        .map(s => s.support as SupportLevel)
        .filter((s): s is SupportLevel => !!s)
    const support: SceneSupportPolicy = {
        initial: ladder[0] ?? 'medium',
        ladder: ladder.length ? ladder : ['maximum', 'high', 'medium', 'low', 'minimal'],
        translation:
            String((act('ENCOUNTER', 'context')?.input as any)?.translationPolicy ?? 'hidden_by_default') === 'on_request'
                ? 'on_request' : 'hidden_by_default',
        hintSource: 'pattern',
        retryPolicy: 'model_after_three',
    }

    // ── CHALLENGE (TRANSFER/INTERACT activities, from the DB) ──
    const sim = act('TRANSFER', 'simulation')
    const unexp = act('TRANSFER', 'unexpected_interaction')
    const roleplay = act('INTERACT', 'role_play')
    const challenge: SceneChallengeSpec = {
        misunderstanding: 'They may not catch it the first time — asking again is part of the skill.',
        variation: String((sim?.input as any)?.context ?? roleplay?.purpose ?? 'same ability, new situation'),
        unexpected: String((unexp?.input as any)?.change ?? 'one detail changes; adapt or repair'),
    }

    // ── EVIDENCE (the assessment contract, from the DB) ──
    const assessment = (engine?.assessment ?? {}) as any
    const mastery = (assessment.mastery ?? {}) as any
    const fnDims: string[] = Array.isArray(assessment?.function?.dimensions) ? assessment.function.dimensions : []
    const evidenceRequirements: SceneEvidenceRequirements = {
        minimumEvidence: Array.isArray(mastery.minimumEvidence)
            ? mastery.minimumEvidence
            : ['controlled', 'guided', 'spontaneous', 'transfer', 'delayed'],
        interactionRequired: mastery.interactionRequired === true || fnDims.includes('interaction'),
        repairRequired: mastery.repairRequired === true || fnDims.includes('repair'),
        intelligibilityRequired: mastery.intelligibilityRequired !== false,
        repeatedContextsRequired: mastery.repeatedContextsRequired === true,
        dimensions: ['comprehension', 'retrieval', 'production', 'interaction', 'transfer'],
    }

    return { world, characters, purpose, targetLanguage, support, challenge, evidenceRequirements }
}