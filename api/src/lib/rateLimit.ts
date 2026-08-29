/**
 * Rate limiting — Phase 38: protect AI, voice, and mission endpoints.
 */
import { Request, Response, NextFunction } from 'express'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix?: string }) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).auth?.userId ?? req.ip ?? 'anon'
        const key = `${opts.keyPrefix ?? 'rl'}:${userId}`
        const now = Date.now()
        let bucket = buckets.get(key)
        if (!bucket || now > bucket.resetAt) {
            bucket = { count: 0, resetAt: now + opts.windowMs }
            buckets.set(key, bucket)
        }
        bucket.count += 1
        if (bucket.count > opts.max) {
            return res.status(429).json({
                error: 'Too many requests. Please wait a moment and try again.',
                retryAfterMs: bucket.resetAt - now,
            })
        }
        next()
    }
}

export const aiRateLimit = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'ai' })
export const voiceRateLimit = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'voice' })
export const missionRateLimit = rateLimit({ windowMs: 60_000, max: 40, keyPrefix: 'mission' })
