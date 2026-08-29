#!/usr/bin/env tsx
/**
 * Content validation CLI — Phase 18.
 * Usage: npm run validate:content
 */
import { phases } from './phases'
import { runContentValidation } from './validate'

async function main() {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    try {
        const comps = await prisma.competency.findMany({ select: { code: true } })
        const knownCodes = new Set(comps.map(c => String(c.code).trim()))
        const report = runContentValidation(phases, knownCodes)

        if (report.warnings.length) {
            console.warn('Warnings:')
            report.warnings.forEach((w: string) => console.warn('  -', w))
        }
        if (!report.passed) {
            console.error('Content validation FAILED:')
            report.errors.forEach((e: string) => console.error('  -', e))
            process.exit(1)
        }
        console.log(`Content validation passed (${phases.length} phase(s), ${knownCodes.size} competencies in DB).`)
    } finally {
        await prisma.$disconnect()
    }
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
