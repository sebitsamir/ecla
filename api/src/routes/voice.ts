import { Router, Request, Response, NextFunction, raw } from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { groq } from '../lib/groq'
import { getOrSyncUser } from '../lib/auth'

const router = Router()

router.post(
    '/api/v1/voice/transcribe',
    raw({ type: ['audio/*', 'application/octet-stream'], limit: '15mb' }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await getOrSyncUser(req)
            const tmp = path.join(os.tmpdir(), `voice-${Date.now()}.webm`)
            fs.writeFileSync(tmp, req.body)

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tmp),
                model: 'whisper-large-v3-turbo',
                // language: 'es',  // leave off = auto-detect (learners mix ES/EN)
            })
            fs.unlinkSync(tmp)
            res.json({ text: transcription.text })
        } catch (error) { next(error) }
    }
)

export default router