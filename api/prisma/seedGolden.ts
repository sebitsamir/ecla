import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedGolden } from '../src/golden/seed'

const db = new PrismaClient()
seedGolden(db).then(ids => console.log(`Published ${ids.length} golden pilot versions. Educator review and recorded audio are still pending.`))
    .catch(error => { console.error('Golden seed failed:', error); process.exitCode = 1 })
    .finally(() => db.$disconnect())
