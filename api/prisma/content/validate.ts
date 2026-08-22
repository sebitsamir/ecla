/**
 * Content validation gate (Art. 23).
 * Deterministic rules BLOCK the seed; AI critique is advisory only.
 */
import type { PhaseContent } from './types'

const CODE_RE = /^PA1\.[A-Z]{2,3}\.[A-Z]{2,3}\.\d{2}$/
const EN_LEAK = /\b(the|is|are|you|want|please|water|coffee|good morning|thank)\b/i
const esish = (s: string) =>
    /[áéíóúñ¿¡]/.test(s) ||
    /^(¡?hola|adi[oó]s|buenos|buenas|s[ií]|no|mira|escucha|repite|lee|quiero|necesito|me llamo|soy|estoy|tengo|vivo|hablo|¿|un |una |el |la |gracias|por favor)/i.test(s.trim())

export type Report = { passed: boolean; errors: string[]; warnings: string[] }

export function validatePhases(phases: PhaseContent[], knownCodes: Set<string>): Report {
    const errors: string[] = []
    const warnings: string[] = []
    const proposed = new Set(phases.flatMap(p => (p.proposedSeedAdditions ?? []).map(a => a.code)))
    const seen = new Set<string>()

    for (const phase of phases) {
        const tag = `Phase ${phase.phase}`
        if (!phase.unitMapping?.trim()) warnings.push(`${tag}: missing unitMapping`)

        for (const c of phase.competencies) {
            const id = `${tag}/${c.code}`
            if (seen.has(c.code)) errors.push(`${id}: duplicate competency across phases`)
            seen.add(c.code)
            if (!CODE_RE.test(c.code)) errors.push(`${id}: bad code format`)
            if (!knownCodes.has(c.code) && !proposed.has(c.code))
                errors.push(`${id}: not in seed.ts and not proposed via proposedSeedAdditions`)

            // Spanish-only surfaces (answers, dialogue, utterances, acceptable responses)
            const esFields: Array<[string, string | undefined]> = [
                ...(c.story?.dialogue ?? []).map(d => ['story.dialogue', d.line] as [string, string]),
                ...(c.immersion?.script ?? []).map(s => ['immersion.script', s.line] as [string, string]),
                ...(c.drill ?? []).map(d => ['drill.answer', d.answer] as [string, string]),
                ...(c.listening ?? []).map(l => ['listening.utterance', l.utterance] as [string, string]),
                ...(c.mission?.acceptableResponses ?? []).map(r => ['mission.acceptableResponses', r] as [string, string]),
            ]
            for (const [name, value] of esFields) {
                if (!value?.trim()) errors.push(`${id}: empty ${name}`)
                else if (EN_LEAK.test(value)) errors.push(`${id}: English leak in ${name}: "${value}"`)
                else if (!esish(value)) warnings.push(`${id}: weak Spanish markers in ${name}: "${value}"`)
            }

            for (const d of c.drill ?? []) {
                if (!d.prompt?.trim()) errors.push(`${id}: drill item missing prompt`)
                if (d.kind === 'mcq' && !d.accept?.length) warnings.push(`${id}: mcq without accept variants`)
            }
            if (c.mission) {
                if (!c.mission.scenario?.trim()) errors.push(`${id}: mission missing scenario`)
                if (!c.mission.successCriteria?.length) errors.push(`${id}: mission missing successCriteria`)
                if (!c.mission.acceptableResponses?.length) errors.push(`${id}: mission missing acceptableResponses`)
            }
            for (const r of c.retention?.reuseIn ?? []) {
                if (!CODE_RE.test(r)) warnings.push(`${id}: retention.reuseIn bad code ${r}`)
            }
        }
    }
    return { passed: errors.length === 0, errors, warnings }
}

/** Advisory AI critique — never blocks the seed (human + rules decide). */
export async function critiquePhases(phases: PhaseContent[]): Promise<string[]> {
    try {
        const { groq } = await import('../../src/lib/groq')
        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0,
            max_tokens: 200,
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'system',
                    content: 'You are a strict Spanish curriculum reviewer (Pre-A1). Check naturalness, level appropriateness, cultural accuracy, and constitution compliance (no trick items, meaning-first). Return JSON only: {"issues":["..."]}',
                },
                { role: 'user', content: JSON.stringify(phases).slice(0, 12000) },
            ],
        } as any)
        const parsed = JSON.parse((completion.choices[0]?.message?.content ?? '{}').match(/\{[\s\S]*\}/)?.[0] ?? '{}')
        return Array.isArray(parsed.issues) ? parsed.issues.map(String) : []
    } catch {
        return []
    }
}