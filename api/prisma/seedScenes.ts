import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedCanonicalScenes } from '../src/scenes/seed'
import { seedPreA1PortfolioScenes } from '../src/scenes/preA1Portfolio'
const db = new PrismaClient()
Promise.all([seedCanonicalScenes(db), seedPreA1PortfolioScenes(db)]).then(([golden, portfolio]) => console.log(`Prepared ${golden.length + portfolio.rows.length} canonical drafts; ${portfolio.reviewBlockers.length} independent review approvals remain. Nothing was published.`))
    .catch(error => { console.error(error instanceof Error ? error.message : 'Canonical seed failed'); process.exitCode = 1 })
    .finally(() => db.$disconnect())
