#!/usr/bin/env tsx
import { PRE_A1_CODES } from './spanish/pre-a1/codes'
import { PRE_A1_PORTFOLIO } from './spanish/pre-a1/portfolio'
import { validatePreA1Portfolio } from './spanish/pre-a1/portfolio-validation'

const report = validatePreA1Portfolio(PRE_A1_PORTFOLIO, PRE_A1_CODES)
if (!report.passed) {
    console.error('Pre-A1 portfolio validation failed:')
    report.errors.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
}
console.log(`Pre-A1 portfolio structure passed: ${PRE_A1_PORTFOLIO.length} competencies and ${PRE_A1_PORTFOLIO.reduce((sum, item) => sum + item.contexts.length, 0)} authored contexts.`)
console.log(`Publication readiness: blocked by ${report.reviewBlockers.length} independent review approvals.`)
