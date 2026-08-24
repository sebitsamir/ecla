import type { CharacterId, Environment, SceneOption } from '@/lib/sceneTypes'

export type ArchetypeId =
    | 'encounter' | 'discovery' | 'conversation' | 'transaction'
    | 'environment' | 'navigation' | 'problem' | 'repair'
    | 'simulation' | 'challenge' | 'reflection' | 'gateway'

export type SceneBlueprint = {
    id: string
    competency: string
    unit: number
    title: string
    archetype: ArchetypeId
    environment: Environment
    mood?: 'warm' | 'calm' | 'busy' | 'quiet'
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
    characters: [CharacterId, CharacterId]
    enter: string
    understandPrompt: string
    understandCoach?: string
    understandOptions?: SceneOption[]
    producePrompt?: string
    challenge?: { es: string; prompt: string; expected: string[] }
    interactPrompt?: string
    transferSetting: string
    transferPrompt: string
    retain: string
    variations?: string[]
}

export const UNIT1: SceneBlueprint[] = [
    {
        id: 'scene-pa1-snd-lst-01', competency: 'PA1.SND.LST.01', unit: 1,
        title: 'The five vowels', archetype: 'discovery',
        environment: 'cafe', mood: 'calm', timeOfDay: 'morning',
        characters: ['sofia', 'marta'],
        enter: 'The café counter. Sofia writes the menu and reads three words aloud, slowly.',
        understandPrompt: 'In English, the "a" in "name" and the "a" in "father" sound different. In Spanish, the "a"…',
        transferSetting: 'The café · A customer\u2019s phone rings',
        transferPrompt: '',
        retain: 'Five vowels. One stable sound each. Every Spanish word you read is now decodable.',
    },
    {
        id: 'scene-pa1-snd-lst-02', competency: 'PA1.SND.LST.02', unit: 1,
        title: 'The language of learning', archetype: 'encounter',
        environment: 'cafe', mood: 'warm', timeOfDay: 'morning',
        characters: ['sofia', 'marta'],
        enter: 'Sofia leans on the counter, teaching you the way a friend would.',
        understandPrompt: 'She said "Escucha." What does she want you to do?',
        transferSetting: 'The hallway · Marta with a podcast',
        transferPrompt: 'She wants you to speak. Say any greeting.',
        retain: 'Escucha. Repite. Mira. Lee. You understand the language of learning itself.',
    },
    {
        id: 'scene-pa1-soc-grt-01', competency: 'PA1.SOC.GRT.01', unit: 1,
        title: 'Your first greetings', archetype: 'conversation',
        environment: 'cafe', mood: 'warm', timeOfDay: 'morning',
        characters: ['sofia', 'marta'],
        enter: 'The café door opens. Morning light. Someone behind the counter looks up and smiles.',
        understandPrompt: 'She looked straight at you and spoke. What is she doing?',
        transferSetting: 'Your building · The hallway · 19:30',
        transferPrompt: 'Greet her back. No hints — you know this.',
        retain: 'Two people. Two hours of the day. You greeted both. These words are yours now.',
    },
    {
        id: 'scene-pa1-soc-grt-02', competency: 'PA1.SOC.GRT.02', unit: 1,
        title: 'Leaving warmly', archetype: 'conversation',
        environment: 'cafe', mood: 'warm', timeOfDay: 'evening',
        characters: ['sofia', 'marta'],
        enter: 'Closing time. Sofia wipes the counter and sees you to the door.',
        understandPrompt: 'She is leaving the counter and smiles. What is she doing?',
        understandOptions: [
            { label: 'Saying goodbye', correct: true },
            { label: 'Greeting you' },
            { label: 'Asking for your name' },
        ],
        producePrompt: 'You leave at noon. Say goodbye for now.',
        challenge: { es: 'Hasta mañana.', prompt: 'The next morning she sees you again. She says:', expected: ['hasta mañana'] },
        interactPrompt: 'It\u2019s night. You\u2019ll see her tomorrow. Which goodbye fits?',
        transferSetting: 'Your building · The door · Evening',
        transferPrompt: 'Say goodbye to her.',
        retain: 'Every hello has a door. You now know how to walk through it.',
    },
    {
        id: 'scene-pa1-soc-cou-01', competency: 'PA1.SOC.COU.01', unit: 1,
        title: 'The small kindnesses', archetype: 'transaction',
        environment: 'cafe', mood: 'busy', timeOfDay: 'morning',
        characters: ['sofia', 'marta'],
        enter: 'The counter. Sofia sets down a cup and names it.',
        understandPrompt: 'You will learn to say "Un café, por favor." What does "por favor" do?',
        transferSetting: 'Your building · The door · Evening',
        transferPrompt: 'Thank her warmly.',
        retain: 'Please, thank you, sorry. The three keys that open every door.',
    },
]