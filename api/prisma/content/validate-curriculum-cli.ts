#!/usr/bin/env tsx
/**
 * Curriculum integrity CLI — Phase 45.
 * Usage: npm run validate:curriculum
 */
import { validateCurriculumIntegrity } from './curriculumIntegrity'

async function main() {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    try {
        const report = await validateCurriculumIntegrity(prisma)
        if (report.warnings.length) {
            console.warn('Warnings:')
            report.warnings.forEach(w => console.warn('  -', w))
        }
        if (!report.passed) {
            console.error('Curriculum integrity FAILED:')
            report.errors.forEach(e => console.error('  -', e))
            process.exit(1)
        }
        console.log('Curriculum integrity passed.')
    } finally {
        await prisma.$disconnect()
    }
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
