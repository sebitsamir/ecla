/**
 * Rate limiting — Phase 38: protect AI, voice, and mission endpoints.
 */
import type { NextFunction, Request, Response } from 'express'
import { Prisma, type PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

export type RateLimitStore = { consume(key: string, windowStart: Date, expiresAt: Date): Promise<number> }

export class PostgresRateLimitStore implements RateLimitStore {
    constructor(private db: PrismaClient) {}
    async consume(key: string, windowStart: Date, expiresAt: Date) {
        const rows = await this.db.$queryRaw<Array<{ count: number }>>(Prisma.sql`
            INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
            VALUES (${key}, 1, ${windowStart}, ${expiresAt})
            ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
            RETURNING "count"
        `)
        if (Math.random() < .01) void this.db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined)
        return rows[0]?.count ?? 1
    }
}

type Options = { windowMs: number; max: number; keyPrefix: string }
const sharedStore = new PostgresRateLimitStore(prisma)

export function rateLimit(opts: Options, store: RateLimitStore = sharedStore, clock: () => number = Date.now) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const now = clock()
            const windowEpoch = Math.floor(now / opts.windowMs)
            const resetAt = (windowEpoch + 1) * opts.windowMs
            const auth = req as Request & { auth?: { userId?: string } }
            const subject = auth.auth?.userId ?? req.ip ?? 'anon'
            const count = await store.consume(`${opts.keyPrefix}:${subject}:${windowEpoch}`, new Date(windowEpoch * opts.windowMs), new Date(resetAt + opts.windowMs))
            res.setHeader('RateLimit-Limit', String(opts.max))
            res.setHeader('RateLimit-Remaining', String(Math.max(0, opts.max - count)))
            res.setHeader('RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
            if (count > opts.max) {
                const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000))
                res.setHeader('Retry-After', String(retryAfter))
                return res.status(429).json({ code: 'RATE_LIMITED', error: 'Too many requests. Please wait and try again.', retryAfterMs: retryAfter * 1000 })
            }
            next()
        } catch (error) { next(error) }
    }
}

const envInt = (name: string, fallback: number) => { const value = Number(process.env[name]); return Number.isInteger(value) && value > 0 ? value : fallback }
export const aiRateLimit = rateLimit({ windowMs: 60_000, max: envInt('AI_REQUESTS_PER_MINUTE', 30), keyPrefix: 'ai-minute' })
export const aiDailyBudget = rateLimit({ windowMs: 86_400_000, max: envInt('AI_REQUESTS_PER_USER_DAY', 200), keyPrefix: 'ai-day' })
export const voiceRateLimit = rateLimit({ windowMs: 60_000, max: envInt('VOICE_REQUESTS_PER_MINUTE', 20), keyPrefix: 'voice-minute' })
export const voiceDailyBudget = rateLimit({ windowMs: 86_400_000, max: envInt('VOICE_REQUESTS_PER_USER_DAY', 60), keyPrefix: 'voice-day' })
export const missionRateLimit = rateLimit({ windowMs: 60_000, max: envInt('MISSION_REQUESTS_PER_MINUTE', 40), keyPrefix: 'mission-minute' })
export const missionDailyBudget = rateLimit({ windowMs: 86_400_000, max: envInt('MISSION_REQUESTS_PER_USER_DAY', 150), keyPrefix: 'mission-day' })
