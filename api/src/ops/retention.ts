import { prisma } from '../lib/prisma'
import { log } from '../lib/observability'

async function run() {
    const now = new Date()
    const planCutoff = new Date(now.getTime() - 90 * 86_400_000)
    const eventCutoff = new Date(now.getTime() - 365 * 86_400_000)
    const [rateLimits, plans, events] = await prisma.$transaction([
        prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }),
        prisma.learnerPlanSnapshot.deleteMany({ where: { generatedAt: { lt: planCutoff } } }),
        prisma.learnerEvent.deleteMany({ where: { createdAt: { lt: eventCutoff } } }),
    ])
    log('info', 'retention_completed', { rateLimits: rateLimits.count, plans: plans.count, events: events.count })
}
run().catch(error => { log('error', 'retention_failed', { error: error instanceof Error ? error.message : 'Unknown error' }); process.exitCode = 1 }).finally(() => prisma.$disconnect())
