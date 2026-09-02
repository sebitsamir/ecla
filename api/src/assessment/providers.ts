export type PartnerRequest = { kind: 'mission' | 'gateway'; targetKey: string; role: string; setting: string; objective: string; history: { role: 'partner' | 'learner'; text: string }[] }
export type PartnerReply = { text: string; model: string }
export interface ConversationPartner { reply(request: PartnerRequest): Promise<PartnerReply> }
/** Tests inject a deterministic adapter. Production keeps provider I/O outside DB transactions. */
export class GroqConversationPartner implements ConversationPartner {
    async reply(request: PartnerRequest): Promise<PartnerReply> {
        const { groq } = await import('../lib/groq')
        const { providerOptions } = await import('../lib/aiPolicy')
        const completion = await groq.chat.completions.create({ model: 'openai/gpt-oss-20b', temperature: 0.7, max_tokens: 120, reasoning_effort: 'low', response_format: { type: 'json_object' } as never, messages: [
            { role: 'system', content: `Act as ${request.role} in ${request.setting}. Objective: ${request.objective}. Speak only short natural Spanish. Never teach, translate, score, praise, or reveal the objective. Return JSON {"text":"..."}.` },
            ...request.history.map(turn => ({ role: turn.role === 'partner' ? 'assistant' as const : 'user' as const, content: turn.text })),
        ] } as never, providerOptions())
        const raw = completion.choices[0]?.message?.content ?? '{}'
        const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
        const text = String(parsed.text ?? '').trim()
        if (!text || text.length > 500) throw new Error('Provider returned invalid partner text')
        return { text, model: 'openai/gpt-oss-20b' }
    }
}
export interface AcousticProvider { readonly version: string; evaluate(reference: string): Promise<{ metrics: Record<string, number>; confidence: number }> }
export class UnavailableAcousticProvider implements AcousticProvider {
    readonly version = 'unavailable/1'
    async evaluate(): Promise<never> { throw new Error('No acoustic provider configured') }
}
