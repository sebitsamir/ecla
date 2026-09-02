import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
type Level = 'info' | 'warn' | 'error'

export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
    const row = JSON.stringify({ timestamp: new Date().toISOString(), level, service: 'ecla-api', event, ...fields })
    if (level === 'error') console.error(row)
    else if (level === 'warn') console.warn(row)
    else console.log(row)
}

export function requestObservability(req: Request, res: Response, next: NextFunction) {
    const supplied = req.header('x-request-id')
    const requestId = supplied && REQUEST_ID.test(supplied) ? supplied : randomUUID()
    const started = performance.now()
    res.locals.requestId = requestId
    res.setHeader('X-Request-Id', requestId)
    res.once('finish', () => log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http_request', {
        requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Math.round(performance.now() - started),
    }))
    next()
}

export const requestIdOf = (res: Response) => String(res.locals.requestId ?? '')
export const errorMessage = (error: unknown) => error instanceof Error ? error.message.slice(0, 500) : 'Unknown error'
