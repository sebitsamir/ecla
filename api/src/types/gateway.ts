/**
 * Gateway types shared between API and client.
 */

export const GATEWAY_SCENARIOS = [
    'stranger_intro',
    'shop_purchase',
    'directions',
    'restaurant_request',
    'deliberate_misunderstanding',
    'free_objective',
] as const

export type GatewayScenarioId = (typeof GATEWAY_SCENARIOS)[number]

export type GatewayTurn = {
    role: 'ai' | 'learner' | 'narrator'
    text: string
}

export type GatewayAIConfig = {
    role: string
    setting: string
    secretObjective: string
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
        secretObjective: "Pretend you didn't hear them the first time. Force them to repeat or repair (¿Puedes repetir?).",
        openingLine: 'Sí, dígame. ¿En qué le ayudo?',
    },
    free_objective: {
        role: 'A new acquaintance',
        setting: 'A park bench',
        secretObjective: 'Let them lead. See if they can sustain a 3-turn interaction without prompting.',
        openingLine: 'Hace buen día hoy, ¿no?',
    },
}