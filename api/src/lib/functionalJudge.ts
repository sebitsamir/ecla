/**
 * Functional judge — Phase 17 shared meaning assessment.
 *
 * AI answers ONE question: "Did this communicate the intended meaning?"
 * Output passes through a deterministic rubric before any mastery decision.
 */
import { groq } from './groq'

export type JudgeInput = {
    answer: string
    expected: string
    accept?: string[]
    context?: string
}

export type JudgeEvidence = {
    meaningMatch: boolean
    keyInfoPresent: boolean
}

export type JudgeResult = {
    accept: boolean
    reason: string
    evidence: JudgeEvidence
    source: 'ai' | 'fallback'
}

const SYSTEM = `You are a strict Spanish MEANING assessment function for Pre-A1 learners.
Reply with JSON only: {"meaningMatch":true|false,"keyInfoPresent":true|false,"reason":"max 8 words"}

RULES:
- Judge FUNCTION only — did the learner communicate the core meaning?
- Allow minor grammar errors, missing accents, wrong word order.
- NEVER comment on grammar rules, vocabulary lists, cultural facts, or proficiency level.
- NEVER invent facts not in the references.
- meaningMatch=false when meaning differs, is opposite, or key information is missing.
- keyInfoPresent=false when a required piece of information from references is absent.`

export async function functionalJudge(input: JudgeInput): Promise<JudgeResult> {
    const refs = [input.expected, ...(input.accept ?? [])].filter(Boolean)
    const fallback: JudgeResult = {
        accept: false,
        reason: 'Could not verify meaning',
        evidence: { meaningMatch: false, keyInfoPresent: false },
        source: 'fallback',
    }

    try {
        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0,
            max_tokens: 80,
            reasoning_effort: 'low',
            response_format: { type: 'json_object' } as any,
            messages: [
                { role: 'system', content: SYSTEM },
                {
                    role: 'user',
                    content: [
                        input.context ? `Context: ${input.context}` : '',
                        `References: ${JSON.stringify(refs)}`,
                        `Learner: ${input.answer}`,
                    ].filter(Boolean).join('\n'),
                },
            ],
        } as any)

        const raw = completion.choices[0]?.message?.content ?? '{}'
        const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
        const evidence: JudgeEvidence = {
            meaningMatch: parsed.meaningMatch === true,
            keyInfoPresent: parsed.keyInfoPresent !== false,
        }

        // Deterministic rubric: BOTH must be true (never AI → MASTERED directly elsewhere)
        const accept = evidence.meaningMatch && evidence.keyInfoPresent

        return {
            accept,
            reason: String(parsed.reason ?? (accept ? 'Meaning communicated' : 'Meaning unclear')),
            evidence,
            source: 'ai',
        }
    } catch {
        return fallback
    }
}
