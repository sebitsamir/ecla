/**
 * ECLA Gateway — The Pre-A1 continuous simulation (Phase 10).
 * 
 * The Gateway is not a quiz. It is a sequence of real-world problems
 * where the learner must function without ECLA's scaffolding.
 * Evidence is captured silently; graduation is based on demonstrated
 * ability, not a percentage score (Constitution Art. 24).
 */

/** The sequence of real-world problems in the Pre-A1 Gateway. */
export const GATEWAY_SCENARIOS = [
    'stranger_intro',
    'shop_purchase',
    'directions',
    'restaurant_request',
    'deliberate_misunderstanding',
    'free_objective',
] as const

export type GatewayScenarioId = (typeof GATEWAY_SCENARIOS)[number]

/** A single turn in the continuous simulation. */
export type GatewayTurn = {
    role: 'ai' | 'learner' | 'narrator'
    text: string
}

/** 
 * Evidence captured silently during a scenario. 
 * The learner never sees this while playing.
 */
export type GatewayEvidence = {
    scenario: GatewayScenarioId
    /** Did they successfully communicate the core intent? */
    communicated: boolean
    /** Did they successfully recover from a breakdown? */
    repaired: boolean
    /** The full transcript for post-simulation review. */
    transcript: GatewayTurn[]
}

/** The overall state of the Gateway session. */
export type GatewaySession = {
    id: string
    status: 'active' | 'graduated' | 'needs_practice'
    currentScenarioIndex: number
    evidence: GatewayEvidence[]
}

/** 
 * The AI's hidden configuration for a scenario. 
 * The learner never sees this; it drives the Groq system prompt.
 */
export type GatewayAIConfig = {
    role: string
    setting: string
    /** What the AI is secretly trying to achieve or force the learner to do. */
    secretObjective: string
    /** The AI's opening line to start the scenario. */
    openingLine: string
}

export const GATEWAY_CONFIGS: Record<GatewayScenarioId, GatewayAIConfig> = {
    stranger_intro: {
        role: 'A friendly local at a community event',
        setting: 'A community event in Madrid',
        secretObjective: 'Find out their name and where they are from.',
        openingLine: '¡Hola! Buenas tardes. ¿Qué tal?',
    },
    shop_purchase: {
        role: 'A busy shopkeeper',
        setting: 'A small corner shop',
        secretObjective: 'You are completely out of tea. Force them to ask for water or coffee instead.',
        openingLine: 'Buenos días. ¿Qué necesita?',
    },
    directions: {
        role: 'A person walking their dog',
        setting: 'A street corner',
        secretObjective: 'Give them simple directions (straight, left, right) to the plaza.',
        openingLine: '¡Hola! ¿Buscas algo?',
    },
    restaurant_request: {
        role: 'A fast-talking waiter',
        setting: 'A busy café',
        secretObjective: 'Ask if they want the menu or if they already know what they want.',
        openingLine: 'Buenas. ¿Tienen mesa para uno? ¿Qué van a tomar?',
    },
    deliberate_misunderstanding: {
        role: 'A distracted receptionist',
        setting: 'A hotel lobby',
        secretObjective: 'Pretend you didn\'t hear them the first time. Force them to repeat or repair (¿Puedes repetir?).',
        openingLine: 'Sí, dígame. ¿En qué le ayudo?',
    },
    free_objective: {
        role: 'A new acquaintance',
        setting: 'A park bench',
        secretObjective: 'Let them lead. See if they can sustain a 3-turn interaction without prompting.',
        openingLine: 'Hace buen día hoy, ¿no?',
    },
}