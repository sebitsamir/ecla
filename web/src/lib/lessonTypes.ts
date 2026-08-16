/* The pedagogy contract: understand → practice → use */

export type TeachBlock =
    | { type: 'explain'; text: string }
    | { type: 'example'; es: string; en: string }
    | { type: 'vocab'; items: { word: string; translation: string }[] }
    | { type: 'tip'; text: string }
    | { type: 'alphabet'; text: string }

export type ExerciseV2 =
    | { type: 'mcq'; prompt: string; options: string[]; answer: string; hint?: string; whyExplanation?: string }
    | { type: 'fill_blank'; prompt: string; answer: string; hint?: string; whyExplanation?: string }
    | { type: 'translate'; prompt: string; answer: string; hint?: string; whyExplanation?: string }
    | { type: 'listen_choose'; audio: string; options: string[]; answer: string; hint?: string; whyExplanation?: string }
    | { type: 'listen_type'; audio: string; answer: string; hint?: string; whyExplanation?: string }
    | { type: 'match'; pairs: { a: string; b: string }[] }

export type RealLife = { prompt: string; chatSeed?: string }

export type SubLessonData = {
    id: string
    conceptId: string
    orderIndex: number
    title: string
    icon: string
    xpReward: number
    teach: TeachBlock[]
    exercises: ExerciseV2[]
    realLife?: RealLife | null
}