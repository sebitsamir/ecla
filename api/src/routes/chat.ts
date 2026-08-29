import { Router, Request, Response, NextFunction } from 'express'
import { groq } from '../lib/groq'
import { getOrSyncUserFast } from '../lib/auth'
import { AppError } from '../lib/errors'
import { chatSchema } from '../lib/schemas'
import { motivationHints } from '../lib/ai'

const router = Router()

console.log('[BOOT] chat routes v5 (reasoning fix) loaded')

const VOICE_SYSTEM_PROMPT = `You are Ecla, a warm Spanish tutor, in a LIVE VOICE conversation with a learner.
Rules for voice:
- Reply in ONE or TWO short sentences maximum (under 25 words).
- Use simple Spanish appropriate for the student's level. For A1/A2 use very basic vocabulary and present tense.
- ALWAYS end with a short question or prompt so the conversation keeps flowing.
- Plain speech only: no markdown, no emojis, no lists, no parentheses, no translations.
- If the learner makes a mistake, model the correct sentence naturally in your reply — never lecture.
- Be warm, playful, and encouraging, like a friend on a call.`

const TEXT_SYSTEM_PROMPT = (level: string, motivation: string) => `You are the ecla AI Spanish tutor.
The student's CEFR level is ${level}. Their motivation is: ${motivation}. ${motivationHints[motivation] ?? ''}
Rules:
- Reply mostly in Spanish, using vocabulary and grammar appropriate for level ${level}. For A1/A2 use short, simple sentences.
- After your Spanish reply, add ONE short English translation on a new line starting with "EN:" — it is shown as a subtitle and never spoken aloud.
- If the student makes a mistake, gently restate the correct sentence. Never be punishing.
- Keep every reply under 80 words.
- Be warm, encouraging, and a little fun.`

async function callGroqWithRetry(params: any, maxRetries = 2): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const completion = await groq.chat.completions.create(params)
            const reply = completion.choices[0]?.message?.content
            if (reply) return reply
            console.warn(`[CHAT] Attempt ${attempt + 1}: empty response`)
        } catch (error: any) {
            console.error(`[CHAT] Attempt ${attempt + 1} failed:`, error.message)
        }
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
    return null
}

router.post('/api/v1/chat', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isVoice = req.body?.voice === true
        const wantsStream = isVoice && req.body?.stream === true

        const parsed = chatSchema.safeParse(req.body)
        if (!parsed.success) {
            console.error('[CHAT] Validation failed:', JSON.stringify(parsed.error.flatten()))
            throw new AppError('Invalid chat data', 400)
        }

        const user = await getOrSyncUserFast(req)
        const level = user.currentLevel ?? 'A1'
        const motivation = user.motivation ?? 'FUN'

        const systemPrompt = isVoice
            ? `${VOICE_SYSTEM_PROMPT}\nThe student's CEFR level is ${level}.`
            : TEXT_SYSTEM_PROMPT(level, motivation)

        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...parsed.data.messages.map(m => ({ role: m.role, content: m.content })),
        ]

        // Streaming path of the voice
        if (wantsStream) {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache, no-transform')
            res.setHeader('Connection', 'keep-alive')
            res.flushHeaders()

            for (let attempt = 0; attempt <= 2; attempt++) {
                try {
                    const stream = await groq.chat.completions.create({
                        model: 'openai/gpt-oss-20b',
                        messages,
                        temperature: 0.8,
                        max_tokens: 250,             
                        reasoning_effort: 'low', 
                        stream: true,
                    } as any)

                    let chunks = 0
                    let finish = ''
                    for await (const chunk of stream as any) {
                        const choice = chunk.choices?.[0]
                        if (choice?.finish_reason) finish = choice.finish_reason
                        const delta = choice?.delta?.content
                        if (delta) { chunks++; res.write(`data: ${JSON.stringify({ delta })}\n\n`) }
                    }

                    console.log(`[CHAT] stream attempt ${attempt + 1}: chunks=${chunks} finish=${finish}`)
                    if (chunks > 0) { res.write('data: [DONE]\n\n'); return res.end() }
                    console.warn(`[CHAT] Stream attempt ${attempt + 1}: empty (finish=${finish})`)
                } catch (e: any) {
                    console.error(`[CHAT] Stream attempt ${attempt + 1} failed:`, e.message)
                }
                if (attempt < 2) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
            }

            res.write(`data: ${JSON.stringify({ delta: 'No te oí bien. ¿Puedes repetir?' })}\n\n`)
            res.write('data: [DONE]\n\n')
            return res.end()
        }

        // Normal text chat
        const reply = await callGroqWithRetry({
            model: 'openai/gpt-oss-20b',
            messages,
            temperature: 0.7,
            max_tokens: 300,
            reasoning_effort: 'low',
        } as any)

        res.json({ reply: reply ?? 'No te oí bien. ¿Puedes repetir?' })
    } catch (error) {
        next(error)
    }
})

export default router