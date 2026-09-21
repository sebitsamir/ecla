#!/usr/bin/env tsx
import { PRE_A1_REGISTRY, validatePreA1Registry } from './spanish/pre-a1/registry'
import { validateMigrationManifest } from './spanish/pre-a1/migration-manifest'
import { PRE_A1_PORTFOLIO } from './spanish/pre-a1/portfolio'
import { validatePreA1Portfolio } from './spanish/pre-a1/portfolio-validation'
import { validateBenchmarkPackages } from '../../src/curriculum/benchmarks'

const reports = [
    ['registry', validatePreA1Registry()],
    ['migration manifest', validateMigrationManifest()],
    ['portfolio', validatePreA1Portfolio(PRE_A1_PORTFOLIO, new Set(PRE_A1_REGISTRY.map(item => item.code)))],
    ['benchmark packages', validateBenchmarkPackages()],
] as const
let failed = false
for (const [name, report] of reports) {
    if (!report.passed) { failed = true; console.error(`${name} failed:\n${report.errors.map(item => `  - ${item}`).join('\n')}`) }
    else console.log(`${name} passed`)
}
if (failed) process.exitCode = 1
