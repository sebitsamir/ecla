import { Router, Request, Response, NextFunction, raw } from 'express'
import { withTemporaryAudio } from '../lib/temporaryAudio'
import { AppError } from '../lib/errors'
import { groq } from '../lib/groq'
import { getOrSyncUserFast } from '../lib/auth'
import { assessTranscriptionMatch } from '../lib/pronunciationAssess'
import { voiceRateLimit } from '../lib/rateLimit'

const router = Router()

router.post(
    '/api/v1/voice/transcribe',
    voiceRateLimit,
    raw({ type: ['audio/*', 'application/octet-stream'], limit: '15mb' }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await getOrSyncUserFast(req)
            if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
                throw new AppError('A non-empty audio recording is required', 400)
            }
            const transcription = await withTemporaryAudio(req.body, file => groq.audio.transcriptions.create({
                file,
                model: 'whisper-large-v3-turbo',   // FULL model — best accuracy for advanced/complex Spanish
                language: 'es',
                temperature: 0.0,            // deterministic — no hallucination drift
                response_format: 'json',
                // NEUTRAL prompt: locks language + conversational style
                // WITHOUT biasing vocabulary toward beginner phrases
                prompt: 'Conversación en español entre un tutor y un estudiante.',
            }))
            const text = (transcription.text ?? '').trim()
            res.json({ text })
        } catch (error) { next(error) }
    }
)

/** Compatibility route: text-only transcription match, explicitly not acoustic. */
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
            const result = assessTranscriptionMatch(transcript, target)
            res.json(result)
        } catch (error) { next(error) }
    }
)

export default router
