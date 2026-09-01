import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedCanonicalScenes } from '../src/scenes/seed'
const db = new PrismaClient()
seedCanonicalScenes(db).then(rows => console.log(`Prepared ${rows.length} canonical drafts. Review and publish explicitly; no approvals were fabricated.`))
    .catch(error => { console.error(error instanceof Error ? error.message : 'Canonical seed failed'); process.exitCode = 1 })
    .finally(() => db.$disconnect())
