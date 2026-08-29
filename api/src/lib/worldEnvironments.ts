/**
 * World environments — Phase 32: reusable worlds that evolve with the learner.
 */
export type WorldEnvironment = {
    id: string
    name: string
    atmosphere: string
    objects: string[]
    levels: Record<string, string>
}

export const WORLD_ENVIRONMENTS: WorldEnvironment[] = [
    {
        id: 'cafe',
        name: 'Café',
        atmosphere: 'warm, busy, coffee aroma',
        objects: ['counter', 'menu', 'espresso machine'],
        levels: {
            PRE_A1: 'Order a drink politely.',
            A1: 'Ask about options and prices.',
            A2: 'Handle a misunderstanding about your order.',
            B1: 'Explain a dietary restriction.',
        },
    },
    {
        id: 'street',
        name: 'Street',
        atmosphere: 'open air, passing traffic',
        objects: ['kiosk', 'crosswalk', 'bus stop'],
        levels: {
            PRE_A1: 'Ask where something is.',
            A1: 'Buy something at a kiosk.',
            A2: 'Follow simple directions.',
            B1: 'Describe a problem to a passerby.',
        },
    },
    {
        id: 'shop',
        name: 'Shop',
        atmosphere: 'shelves, checkout line',
        objects: ['shelf', 'register', 'bag'],
        levels: {
            PRE_A1: 'Point and ask for an item.',
            A1: 'Ask how much something costs.',
            A2: 'Return an item politely.',
            B1: 'Compare products and ask for advice.',
        },
    },
    {
        id: 'home',
        name: 'Home',
        atmosphere: 'quiet, familiar',
        objects: ['door', 'kitchen', 'phone'],
        levels: {
            PRE_A1: 'Greet someone at the door.',
            A1: 'Invite someone in.',
            A2: 'Explain you are busy.',
            B1: 'Discuss plans for the evening.',
        },
    },
    {
        id: 'classroom',
        name: 'Classroom',
        atmosphere: 'focused, collaborative',
        objects: ['desk', 'board', 'books'],
        levels: {
            PRE_A1: 'Say your name.',
            A1: 'Ask the teacher to repeat.',
            A2: 'Ask a classmate for help.',
            B1: 'Present a short opinion.',
        },
    },
    {
        id: 'restaurant',
        name: 'Restaurant',
        atmosphere: 'tables, waiter service',
        objects: ['menu', 'table', 'bill'],
        levels: {
            PRE_A1: 'Request water.',
            A1: 'Order a meal.',
            A2: 'Ask about ingredients.',
            B1: 'Handle a wrong order.',
        },
    },
    {
        id: 'market',
        name: 'Market',
        atmosphere: 'colorful, noisy, vendors',
        objects: ['stall', 'produce', 'scale'],
        levels: {
            PRE_A1: 'Ask for a quantity.',
            A1: 'Negotiate a simple price.',
            A2: 'Compare two items.',
            B1: 'Explain what you are looking for.',
        },
    },
    {
        id: 'workplace',
        name: 'Workplace',
        atmosphere: 'professional, purposeful',
        objects: ['desk', 'meeting room', 'elevator'],
        levels: {
            PRE_A1: 'Introduce yourself to a colleague.',
            A1: 'Ask for a simple favor.',
            A2: 'Schedule a meeting.',
            B1: 'Explain a delay.',
        },
    },
]

export function environmentFor(location: string): WorldEnvironment | undefined {
    const key = location.toLowerCase()
    return WORLD_ENVIRONMENTS.find(e => key.includes(e.id) || e.name.toLowerCase() === key)
}

export function levelGoal(envId: string, cefrLevel: string): string | null {
    const env = WORLD_ENVIRONMENTS.find(e => e.id === envId)
    return env?.levels[cefrLevel] ?? env?.levels.PRE_A1 ?? null
}
