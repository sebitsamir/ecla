import { Router, Request, Response, NextFunction, raw } from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { groq } from '../lib/groq'
import { getOrSyncUserFast } from '../lib/auth'
import { assessIntelligibility } from '../lib/pronunciationAssess'
import { voiceRateLimit } from '../lib/rateLimit'

const router = Router()

router.post(
    '/api/v1/voice/transcribe',
    voiceRateLimit,
    raw({ type: ['audio/*', 'application/octet-stream'], limit: '15mb' }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await getOrSyncUserFast(req)
            const tmp = path.join(os.tmpdir(), `voice-${Date.now()}.webm`)
            fs.writeFileSync(tmp, req.body)

            const started = Date.now()
            console.log(`[VOICE] Transcribing ${req.body.length} bytes`)

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tmp),
                model: 'whisper-large-v3-turbo',   // FULL model — best accuracy for advanced/complex Spanish
                language: 'es',
                temperature: 0.0,            // deterministic — no hallucination drift
                response_format: 'json',
                // NEUTRAL prompt: locks language + conversational style
                // WITHOUT biasing vocabulary toward beginner phrases
                prompt: 'Conversación en español entre un tutor y un estudiante.',
            })

            fs.unlinkSync(tmp)
            const text = (transcription.text ?? '').trim()
            console.log(`[VOICE] ${Date.now() - started}ms → "${text}"`)
            res.json({ text })
        } catch (error) { next(error) }
    }
)

/** Phase 24: intelligibility assessment (transcript-based; upgradeable to acoustic). */
router.post(
    '/api/v1/voice/assess',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await getOrSyncUserFast(req)
            const { transcript, target } = req.body ?? {}
            if (typeof transcript !== 'string' || typeof target !== 'string') {
                res.status(400).json({ error: 'transcript and target required' })
                return
            }
            const result = assessIntelligibility(transcript, target)
            res.json(result)
        } catch (error) { next(error) }
    }
)

export default router