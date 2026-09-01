import { Router, type Request } from 'express'
import { z } from 'zod'
import { requireAdmin, getOrSyncUser } from '../lib/auth'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { ScenePlatform } from '../scenes/platform'
import { compileScene, migrateSceneSource } from '../scenes/compiler'

export function scenePlatformRouter(platform: ScenePlatform, admin: (req: Request) => string, learner: (req: Request) => Promise<string>) {
    const router = Router()
    const parse = <T>(schema: z.ZodType<T>, input: unknown): T => { const result = schema.safeParse(input); if (!result.success) throw new AppError('Invalid scene request', 400); return result.data }
    const id = (req: Request) => parse(z.uuid(), req.params.id)
    router.post('/api/v1/admin/scenes/validate', (req, res, next) => { try { admin(req); res.json(compileScene(req.body)) } catch (error) { next(error) } })
    router.post('/api/v1/admin/scenes/migrate', (req, res, next) => { try { admin(req); res.json({ source: migrateSceneSource(req.body) }) } catch (error) { next(error) } })
    router.post('/api/v1/admin/scenes/drafts', async (req, res, next) => { try { res.json(await platform.draft(admin(req), req.body)) } catch (error) { next(error) } })
    router.get('/api/v1/admin/scenes/:slug/revisions', async (req, res, next) => { try { admin(req); res.json({ revisions: await platform.list(String(req.params.slug)) }) } catch (error) { next(error) } })
    router.get('/api/v1/admin/scene-revisions/:id/preview', async (req, res, next) => { try { admin(req); res.json(await platform.preview(id(req))) } catch (error) { next(error) } })
    router.post('/api/v1/admin/scene-revisions/:id/review', async (req, res, next) => { try { const actor = admin(req); const body = parse(z.object({ note: z.string().trim().min(10).max(2000) }).strict(), req.body); res.json(await platform.review(actor, id(req), body.note)) } catch (error) { next(error) } })
    router.post('/api/v1/admin/scene-revisions/:id/publish', async (req, res, next) => { try { const actor = admin(req); const body = parse(z.object({ expectedRevisionId: z.uuid().nullable() }).strict(), req.body); res.json(await platform.publish(actor, id(req), body.expectedRevisionId)) } catch (error) { next(error) } })
    router.post('/api/v1/admin/scene-revisions/:id/unpublish', async (req, res, next) => { try { const actor = admin(req); parse(z.object({}).strict(), req.body); res.json(await platform.unpublish(actor, id(req))) } catch (error) { next(error) } })
    router.post('/api/v1/scene-visits', async (req, res, next) => { try { const owner = await learner(req); const body = parse(z.object({ revisionId: z.uuid(), requestKey: z.uuid() }).strict(), req.body); const visit = await platform.visit(owner, body.revisionId, body.requestKey); res.json({ id: visit.id, revisionId: visit.revisionId }) } catch (error) { next(error) } })
    return router
}
export default scenePlatformRouter(new ScenePlatform(prisma), requireAdmin, async req => (await getOrSyncUser(req)).id)
