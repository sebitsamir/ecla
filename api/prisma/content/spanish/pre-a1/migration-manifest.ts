import { PRE_A1_CODES } from './registry'

export type MigrationDisposition = 'relocate-draft' | 'retain-partial' | 'review-required'
export type CurriculumMapping = {
    source: string
    sourceVersion: string
    oldCode: string
    meaning: string
    destinationCode: string | null
    disposition: MigrationDisposition
    facets: string[]
    reason: string
}

const map = (source: string, sourceVersion: string, oldCode: string, meaning: string, destinationCode: string | null, disposition: MigrationDisposition, facets: string[], reason: string): CurriculumMapping => ({ source, sourceVersion, oldCode, meaning, destinationCode, disposition, facets, reason })

/** Definitions only. Applying this manifest to persisted evidence requires a separately reviewed migration. */
export const PRE_A1_MIGRATION_MANIFEST: readonly CurriculumMapping[] = [
    map('long-document:initial-repair-dataset','legacy-unversioned','PA1.INT.REP.01','signal non-understanding','PA1.INT.UND.01','review-required',['interaction'],'The retained REP.01 now means request repetition; evidence needs interpretable payload review.'),
    map('long-document:initial-repair-dataset','legacy-unversioned','PA1.INT.REP.02','request repetition','PA1.INT.REP.01','review-required',['interaction'],'Only evidence that actually demonstrates a repetition request can be mapped.'),
    map('long-document:initial-repair-dataset','legacy-unversioned','PA1.INT.REP.03','request slower speech','PA1.INT.SLW.01','review-required',['interaction'],'Speed repair is distinct from repetition.'),
    map('long-document:initial-repair-dataset','legacy-unversioned','PA1.INT.REP.04','ask word meaning','PA1.INT.QUE.01','review-required',['interaction'],'Lexical clarification is distinct from a missing-detail question.'),
    map('long-document:initial-repair-dataset','legacy-unversioned','PA1.INT.REP.05','request assistance','PA1.RL.HEL.01','review-required',['interaction'],'Retain only evidenced help-request facets; rehearsal is not integrated performance.'),
    map('long-document:initial-repair-dataset','legacy-unversioned','PA1.INT.REP.06','confirm information','PA1.INT.CON.01','review-required',['interaction'],'Confirmation evidence must identify the proposition understood.'),
    map('later-integration-graph','legacy-unversioned','PA1.INT.REP.02','integrated conversation repair','PA1.GAT.INT.01','review-required',['interaction','transfer'],'Gateway mapping requires independent assessment evidence; otherwise keep practice facets.'),
    map('portfolio','pre-a1-portfolio/1','PA1.PER.IDN.01','state a role','PA1.PER.ROL.01','relocate-draft',['production'],'IDN.01 remains the combined personal profile.'),
    map('portfolio','pre-a1-portfolio/1','PA1.WLD.NAM.01','name familiar objects','PA1.WLD.OBJ.01','relocate-draft',['production'],'NAM.01 is reserved for familiar people and relationships.'),
    map('portfolio','pre-a1-portfolio/1','PA1.WLD.OBJ.01','state presence with hay/no hay','PA1.WLD.EXT.01','relocate-draft',['production'],'Object naming and existence are separate abilities.'),
    map('portfolio','pre-a1-portfolio/1','PA1.SRV.TIM.01','use whole-hour clock time','PA1.SRV.CLK.01','relocate-draft',['listening','production'],'TIM.01 remains basic time references.'),
    map('portfolio','pre-a1-portfolio/1','PA1.SRV.LOC.01','understand location answers','PA1.SRV.LOC.02','relocate-draft',['listening'],'LOC.01 remains production of the location question.'),
    map('portfolio','pre-a1-portfolio/1','PA1.SRV.LOC.02','follow or give route directions','PA1.SRV.DIR.01','relocate-draft',['listening','production'],'Route work requires a reference and separate evidence.'),
    map('portfolio','pre-a1-portfolio/1','PA1.INT.QUE.01','ask generic question words','PA1.INT.QST.01','relocate-draft',['interaction'],'QUE.01 remains asking what a word means.'),
    map('portfolio','pre-a1-portfolio/1','PA1.GAT.INT.01','complete an introduction or profile','PA1.GAT.PRO.01','review-required',['production','writing','transfer'],'Gateway evidence must come from independent profile assessment; rehearsal moves to RL.INT.01/PER.IDN.01.'),
    map('portfolio','pre-a1-portfolio/1','PA1.GAT.PRO.01','complete a purchase','PA1.GAT.SUR.01','review-required',['interaction','transfer'],'PRO means profile; purchase rehearsal remains SRV.PAY.01.'),
    map('portfolio','pre-a1-portfolio/1','PA1.GAT.SUR.01','repair a conversation','PA1.GAT.INT.01','review-required',['interaction','transfer'],'SUR means bounded survival interaction; repair assessment belongs to GAT.INT.01.'),
    map('portfolio','pre-a1-portfolio/1','PA1.SRV.NUM.01','numbers zero through ten','PA1.SRV.NUM.01','retain-partial',['listening','production'],'Add 11–20 and mixed listening before claiming full coverage.'),
    map('portfolio','pre-a1-portfolio/1','PA1.SRV.PAY.01','ask and repeat a price','PA1.SRV.PAY.01','retain-partial',['interaction'],'Add selection, quantity where relevant, confirmation, and accept/decline.'),
] as const

export type HistoricalRecord = { source?: string; sourceVersion?: string; code: string; meaning?: string; facets?: string[] }
export function dryRunCurriculumMigration(records: readonly HistoricalRecord[]) {
    const mapped: Array<{ record: HistoricalRecord; mapping: CurriculumMapping }> = []
    const unchanged: HistoricalRecord[] = []
    const reviewRequired: Array<{ record: HistoricalRecord; reason: string }> = []
    for (const record of records) {
        if (!record.source || !record.sourceVersion || !record.meaning) {
            reviewRequired.push({ record, reason: 'Missing source, sourceVersion, or interpretable meaning; automatic migration is forbidden.' })
            continue
        }
        const candidates = PRE_A1_MIGRATION_MANIFEST.filter(item => item.source === record.source && item.sourceVersion === record.sourceVersion && item.oldCode === record.code && item.meaning === record.meaning)
        if (candidates.length !== 1) {
            if (PRE_A1_CODES.has(record.code)) unchanged.push(record)
            else reviewRequired.push({ record, reason: candidates.length ? 'Ambiguous source-qualified mapping.' : 'Unknown historical mapping.' })
            continue
        }
        const mapping = candidates[0]
        if (!mapping.destinationCode || mapping.disposition === 'review-required') reviewRequired.push({ record, reason: mapping.reason })
        else mapped.push({ record, mapping })
    }
    return { safeToApply: reviewRequired.length === 0, mapped, unchanged, reviewRequired }
}

export function validateMigrationManifest() {
    const errors: string[] = []
    const keys = new Set<string>()
    for (const item of PRE_A1_MIGRATION_MANIFEST) {
        const key = [item.source,item.sourceVersion,item.oldCode,item.meaning].join('|')
        if (keys.has(key)) errors.push(`Duplicate mapping: ${key}`)
        keys.add(key)
        if (item.destinationCode && !PRE_A1_CODES.has(item.destinationCode)) errors.push(`${key}: unknown destination ${item.destinationCode}`)
        if (!item.reason.trim() || !item.facets.length) errors.push(`${key}: incomplete mapping rationale or facet scope`)
    }
    return { passed: errors.length === 0, errors }
}
