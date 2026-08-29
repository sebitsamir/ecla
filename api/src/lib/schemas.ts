import { z } from 'zod'

export const onboardingSchema = z.object({
    motivation: z.enum(['TRAVEL', 'HERITAGE', 'CAREER', 'FUN']),
    preferredMode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
    dailyGoalXp: z.number().int().min(1).max(1000),
    currentLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional(),
})

export const lessonCompleteSchema = z.object({
    conceptId: z.string(),
    subLessonId: z.string().optional(),
    mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL', 'MISSION']).default('STORY'),
    correctCount: z.number().int().min(0),
    incorrectCount: z.number().int().min(0),
    xpEarned: z.number().int().min(0).max(100),
    review: z.boolean().optional(),
})

export const modeSchema = z.object({
    mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
})

export const flashcardReviewSchema = z.object({
    vocabId: z.string(),
    quality: z.number().int().min(0).max(5),
})

export const chatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
    })).min(1).max(30),
    voice: z.boolean().optional(),
    stream: z.boolean().optional(),
})

export const conceptSchema = z.object({
    id: z.string().optional(),
    unitId: z.string(),
    name: z.string().min(1),
    cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
    grammarNote: z.string().min(1),
    vocabItems: z.any(),
    orderIndex: z.number().int(),
    xpReward: z.number().int(),
    variants: z.array(z.object({
        mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
        storyBeat: z.string().nullable(),
        culturalRef: z.string().nullable(),
        formalPhrase: z.string().nullable(),
        exercises: z.any(),
    })),
})

export const generateSchema = z.object({
    mode: z.enum(['STORY', 'IMMERSION', 'PROFESSIONAL']),
    conceptName: z.string(),
    grammarNote: z.string(),
    vocabItems: z.any(),
})

export const exerciseGenSchema = z.object({
    mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
    conceptName: z.string(),
    grammarNote: z.string(),
    vocabItems: z.any(),
})