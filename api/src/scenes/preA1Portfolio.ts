import type { PrismaClient } from '@prisma/client'
import { PRE_A1_PORTFOLIO } from '../../prisma/content/spanish/pre-a1/portfolio'
import { PRE_A1_CODES } from '../../prisma/content/spanish/pre-a1/codes'
import { validatePreA1Portfolio } from '../../prisma/content/spanish/pre-a1/portfolio-validation'
import { PORTFOLIO_EXPERIMENT_KEY, portfolioContentVersion } from '../../prisma/content/spanish/pre-a1/portfolio-version'
import { SCENE_CONTRACT } from '../../../packages/contracts/scene'
import { ScenePlatform } from './platform'
import { compileScene, type SceneSource } from './compiler'

export function portfolioSceneSources() {
    return PRE_A1_PORTFOLIO.flatMap(item => item.contexts.map((context, index): SceneSource => compileScene({
        contract: SCENE_CONTRACT,
        schemaVersion: 1,
        slug: `pre-a1-${item.code.toLowerCase().replaceAll('.', '-')}-${context.slug}`,
        competencyCode: item.code,
        title: context.setting,
        setting: context.setting,
        objective: context.learnerGoal,
        purpose: context.slug === item.transfer.contextSlug ? 'transfer' : 'practice',
        contextFingerprint: `${item.code}:${context.slug}:${context.partner}`,
        experiment: { key: PORTFOLIO_EXPERIMENT_KEY, variant: portfolioContentVersion(item) },
        steps: [
            { id: 'listen', stage: 'ENCOUNTER', kind: 'encounter', prompt: `Listen to ${context.partner}. ${context.variation}`, speaker: item.listening[index % item.listening.length].speaker, line: context.opening, audio: { status: 'tts_fallback', locale: item.listening[index % item.listening.length].locale, rate: item.listening[index % item.listening.length].rate } },
            { id: 'spoken-production', stage: 'PRODUCE', kind: 'response', prompt: item.production.spoken, audio: { status: 'tts_fallback', locale: item.listening[(index + 1) % item.listening.length].locale, rate: item.listening[(index + 1) % item.listening.length].rate } },
            { id: 'written-production', stage: 'PRODUCE', kind: 'response', prompt: item.production.written, audio: { status: 'tts_fallback', locale: item.listening[index % item.listening.length].locale, rate: item.listening[index % item.listening.length].rate } },
            { id: 'interaction', stage: 'INTERACT', kind: 'response', prompt: `${item.interaction} Partner variation: ${context.variation}`, audio: { status: 'tts_fallback', locale: item.listening[(index + 1) % item.listening.length].locale, rate: item.listening[(index + 1) % item.listening.length].rate } },
            { id: 'repair', stage: 'INTERACT', kind: 'response', prompt: `${item.repair.trigger} ${item.repair.strategy}`, audio: { status: 'tts_fallback', locale: item.listening[index % item.listening.length].locale, rate: item.listening[index % item.listening.length].rate } },
        ],
    }).source))
}

/** Creates immutable drafts only. External cultural and native-speaker approvals are never inferred. */
export async function seedPreA1PortfolioScenes(db: PrismaClient) {
    const report = validatePreA1Portfolio(PRE_A1_PORTFOLIO, PRE_A1_CODES)
    if (!report.passed) throw new Error(`Pre-A1 portfolio invalid: ${report.errors.join('; ')}`)
    const stored = new Set((await db.competency.findMany({ where: { code: { in: [...PRE_A1_CODES] } }, select: { code: true } })).map(row => row.code))
    const missing = [...PRE_A1_CODES].filter(code => !stored.has(code))
    if (missing.length) throw new Error(`Seed the complete Pre-A1 structure before portfolio scenes. Missing ${missing.length} competencies: ${missing.join(', ')}`)
    const platform = new ScenePlatform(db)
    const rows = []
    for (const source of portfolioSceneSources()) rows.push(await platform.draft('seed:pre-a1-portfolio/1', source))
    return { rows, reviewBlockers: report.reviewBlockers }
}
