import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedCanonicalScenes } from '../src/scenes/seed'
import { seedPreA1PortfolioScenes } from '../src/scenes/preA1Portfolio'
const db = new PrismaClient()

async function main() {
    const golden = await seedCanonicalScenes(db)
    const portfolio = await seedPreA1PortfolioScenes(db)
    console.log(`Prepared ${golden.length + portfolio.rows.length} immutable scene drafts for local preview; ${portfolio.reviewBlockers.length} independent review approvals remain. Nothing was published.`)
}

main()
    .catch(error => { console.error(error instanceof Error ? error.message : 'Canonical seed failed'); process.exitCode = 1 })
    .finally(() => db.$disconnect())
