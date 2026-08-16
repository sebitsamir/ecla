import { Router, Request, Response, NextFunction } from 'express'
import { groq } from '../lib/groq'
import { getOrSyncUser } from '../lib/auth'
import { AppError } from '../lib/errors'
import { chatSchema } from '../lib/schemas'
import { motivationHints } from '../lib/ai'

const router = Router()

router.post('/api/v1/chat', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = chatSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid chat data', 400)

        const user = await getOrSyncUser(req)
        const level = user.currentLevel ?? 'A1'
        const motivation = user.motivation ?? 'FUN'

        const systemPrompt = `You are the ecla AI Spanish tutor.
The student's CEFR level is ${level}. Their motivation is: ${motivation}. ${motivationHints[motivation] ?? ''}
Rules:
- Reply mostly in Spanish, using vocabulary and grammar appropriate for level ${level}. For A1/A2 use short, simple sentences.
- If the level is A1 or A2, add a brief English translation in parentheses after your Spanish reply.
- If the student makes a mistake, gently restate the correct sentence. Never be punishing.
- Keep every reply under 80 words.
- Be warm, encouraging, and a little fun.`

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...parsed.data.messages.map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 300,
        })

        res.json({ reply: completion.choices[0]?.message?.content ?? '...' })
    } catch (error) { next(error) }
})

export default router