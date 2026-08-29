/**
 * Missions Route — ECLA AI Conversation Layer (Phase 6)
 *
 * Constitution Art. 14 (learners must interact), Art. 16 (assessment resembles
 * reality), Art. 6.6 (graduation = performance, not quiz).
 *
 * GET  /api/v1/missions/:competencyId          → mission config for the runner
 * POST /api/v1/missions/:competencyId/turn     → AI role-play partner utterance
 * POST /api/v1/missions/:competencyId/evaluate → FUNCTION judge → MissionAttempt
 *
 * The AI partner is a PERSON, not a teacher: it never says "Correct!", never
 * translates, never explains grammar. If the learner repairs (¿Puedes repetir?),
 * it repeats/rephrases simpler. deliberateVariation introduces one small change
 * to test adaptation (Art. 15 transfer).
 *
 * Evaluation is FUNCTION-first: task_completed + meaning_communicated = passed.
 * Accuracy is recorded as evidence, never as a gate (Art. 24).
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { groq } from '../lib/groq'
import { AppError } from '../lib/errors'
import { applyMissionEvidence } from '../lib/evidenceService'

const router = Router()

/** Learner utterances that count as repair strategies (I3 REPAIR — survival skill) */
const REPAIR_MARKERS = [
    'no entiendo', 'puedes repetir', 'más despacio', 'mas despacio',
    'qué significa', 'que significa', 'cómo se dice', 'como se dice', 'otra vez',
]

export function detectRepair(text: string): boolean {
    const t = text.toLowerCase()
    return REPAIR_MARKERS.some(m => t.includes(m))
}

/** Fetch the mission for a competency (seedSublessons writes one per competency) */
router.get('/api/v1/missions/:competencyId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getOrSyncUserFast(req)
        const mission = await prisma.mission.findFirst({
            where: { competencyId: req.params.competencyId as string },
            include: { competency: { select: { code: true, title: true, canDo: true, domain: true } } },
        })
        if (!mission) throw new AppError('No mission for this competency', 404)
        res.json({ mission })
    } catch (error) { next(error) }
})

/**
 * AI role-play partner turn.
 * Receives the conversation history, returns the partner's next Spanish utterance.
 */
router.post('/api/v1/missions/:competencyId/turn', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getOrSyncUserFast(req)
        const { history = [] } = req.body ?? {}

        const mission = await prisma.mission.findFirst({ where: { competencyId: req.params.competencyId as string } })
        if (!mission) throw new AppError('Mission not found', 404)

        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0.7,
            max_tokens: 120,
            reasoning_effort: 'low',
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'system',
                    content:
                        `You are a Spanish-speaking PERSON in a realistic situation. You are NOT a teacher.\n` +
                        `Scenario: ${mission.scenario}\nConversation goal: ${mission.objective}\n` +
                        `RULES:\n` +
                        `- Speak ONLY Spanish. Keep each turn under 25 words (Pre-A1 learner).\n` +
                        `- Beginner-friendly vocabulary, natural and warm.\n` +
                        `- NEVER say "Correct/Incorrect", never translate, never explain grammar.\n` +
                        `- If the learner asks for repetition/slower/clarification, repeat or rephrase MORE SIMPLY.\n` +
                        `- If the learner is unclear, keep the conversation alive with a simple yes/no question.\n` +
                        `- At most once per conversation, change ONE small detail (price/item/time) to test adaptation.\n` +
                        `Reply with JSON only: {"text":"..."}`,
                },
                ...history.map((h: any) => ({
                    role: h.role === 'ai' ? 'assistant' : 'user',
                    content: h.text,
                })),
            ],
        } as any)

        const text = completion.choices[0]?.message?.content ?? '{}'
        const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
        res.json({ text: String(parsed.text ?? 'Hola.') })
    } catch (error) { next(error) }
})

/**
 * Evaluate the completed mission (FUNCTION-first, Art. 16/6.6).
 * Writes MissionAttempt + updates CompetencyMastery (transfer evidence).
 */
router.post('/api/v1/missions/:competencyId/evaluate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { transcript = [] } = req.body ?? {}

        const mission = await prisma.mission.findFirst({ where: { competencyId: req.params.competencyId as string } })
        if (!mission) throw new AppError('Mission not found', 404)

        const learnerTurns = transcript.filter((t: any) => t.role === 'learner')
        const repairUsed = learnerTurns.some((t: any) => detectRepair(t.text ?? ''))

        // ── FUNCTION judge (with safe fallback) ──
        let taskCompleted = false, meaningCommunicated = false, appropriate = false
        let feedback = ''
        let judgeError = false
        try {
            const completion = await groq.chat.completions.create({
                model: 'openai/gpt-oss-20b',
                temperature: 0,
                max_tokens: 120,
                reasoning_effort: 'low',
                response_format: { type: 'json_object' } as any,
                messages: [
                    {
                        role: 'system',
                        content:
                            `You are an assessment function for a Pre-A1 Spanish speaking mission.\n` +
                            `Objective: ${mission.objective}\nScenario: ${mission.scenario}\n` +
                            `Judge FUNCTION only: did the learner communicate meaning and accomplish the goal?\n` +
                            `A beginner may make grammar mistakes and still succeed ("Me... from Juba." counts).\n` +
                            `Return JSON only: {"task_completed":bool,"meaning_communicated":bool,"appropriate_responses":bool,"feedback":"one short encouraging sentence"}`,
                    },
                    {
                        role: 'user',
                        content: 'TRANSCRIPT:\n' + transcript.map((t: any) => `${t.role === 'ai' ? 'PARTNER' : 'LEARNER'}: ${t.text}`).join('\n'),
                    },
                ],
            } as any)
            const parsed = JSON.parse((completion.choices[0]?.message?.content ?? '{}').match(/\{[\s\S]*\}/)?.[0] ?? '{}')
            taskCompleted = parsed.task_completed === true
            meaningCommunicated = parsed.meaning_communicated === true
            appropriate = parsed.appropriate_responses === true
            feedback = String(parsed.feedback ?? '')
        } catch {
            judgeError = true
        }

        // Infra failure must NEVER fail the learner — treat a solid attempt as passed
        if (judgeError) {
            const solid = learnerTurns.length >= 3
            taskCompleted = solid
            meaningCommunicated = solid
            appropriate = true
            feedback = 'Recorded — automatic evaluation was unavailable this time.'
        }

        const passed = taskCompleted && meaningCommunicated
        const score = Math.round(
            (taskCompleted ? 50 : 0) + (meaningCommunicated ? 30 : 0) +
            (appropriate ? 10 : 0) + (repairUsed ? 10 : 0)
        )

        // ── Write evidence ──
        await prisma.missionAttempt.create({
            data: {
                missionId: mission.id,
                userId: user.id,
                score,
                passed,
                evidence: {
                    learnerTurns: learnerTurns.length,
                    aiTurns: transcript.length - learnerTurns.length,
                    repairUsed,
                    taskCompleted,
                    meaningCommunicated,
                    judgeError,
                    transcript,
                },
                feedback,
                completedAt: new Date(),
            },
        })

        await applyMissionEvidence({
            userId: user.id,
            competencyId: req.params.competencyId as string,
            passed,
            missionId: mission.id,
        })

        res.json({ passed, score, repairUsed, feedback, judgeError })
    } catch (error) { next(error) }
})

export default router