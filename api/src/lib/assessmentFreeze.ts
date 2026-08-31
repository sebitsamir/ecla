import type { RequestHandler } from 'express'

/**
 * Legacy payloads contain client scores or client-owned transcripts. They are
 * not evidence. Keep this fail-closed until callers use persisted attempts.
 * There is deliberately no environment flag to re-enable these writes.
 */
export const rejectUnverifiedAssessment: RequestHandler = (_req, res) => {
    res.status(409).json({
        code: 'VERIFIED_ATTEMPT_REQUIRED',
        error: 'Assessment is paused while verified attempts are introduced. No mastery, graduation, or XP was recorded.',
    })
}
