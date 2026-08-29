#!/usr/bin/env tsx
/**
 * seedAll — Phase 20 orchestrator.
 * Runs structure seed then pedagogical depth seed in order.
 */
import { execSync } from 'child_process'
import path from 'path'

const root = path.join(__dirname)

function run(cmd: string, label: string) {
    console.log(`\n── ${label} ──`)
    execSync(cmd, { cwd: root, stdio: 'inherit' })
}

async function main() {
    run('npx tsx prisma/seed.ts', 'Structure (seed.ts)')
    run('npx tsx prisma/seedSublessons.ts', 'Content depth (seedSublessons.ts)')
    console.log('\n✓ seedAll complete')
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
