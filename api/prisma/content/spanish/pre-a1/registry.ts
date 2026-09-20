export const PRE_A1_CURRICULUM_VERSION = '1.1.0' as const

export type SkillFacet = 'listening' | 'production' | 'interaction' | 'reading' | 'writing' | 'pronunciation' | 'pragmatics'
export type EvidenceDimension = 'comprehension' | 'retrieval' | 'production' | 'interaction' | 'transfer' | 'retention'
export type Prerequisite = { code: string; type: 'hard' | 'recommended'; reason: string }
export type CanonicalCompetency = {
    code: string
    version: typeof PRE_A1_CURRICULUM_VERSION
    status: 'retained' | 'new'
    unit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    ability: string
    evidenceFocus: string
    facets: readonly SkillFacet[]
    dimensions: readonly EvidenceDimension[]
    prerequisites: readonly Prerequisite[]
}

const ALL: readonly EvidenceDimension[] = ['comprehension', 'retrieval', 'production', 'interaction', 'transfer', 'retention']
const receptive: readonly SkillFacet[] = ['listening']
const communicative: readonly SkillFacet[] = ['listening', 'production', 'interaction', 'pragmatics']
const written: readonly SkillFacet[] = ['reading', 'writing']
const c = (code: string, status: 'retained' | 'new', unit: CanonicalCompetency['unit'], ability: string, evidenceFocus: string, facets: readonly SkillFacet[] = communicative, prerequisites: readonly Prerequisite[] = []): CanonicalCompetency => ({ code, version: PRE_A1_CURRICULUM_VERSION, status, unit, ability, evidenceFocus, facets, dimensions: ALL, prerequisites })
const hard = (code: string, reason: string): Prerequisite => ({ code, type: 'hard', reason })
const recommended = (code: string, reason: string): Prerequisite => ({ code, type: 'recommended', reason })

export const PRE_A1_REGISTRY = [
    c('PA1.SND.LST.01','retained',1,'Distinguish familiar sound contrasts in words','Identify a relevant contrast in supported familiar words.',receptive),
    c('PA1.SND.LST.02','retained',1,'Follow common learning instructions','Perform the requested listening, looking, repeating, or reading action.',receptive),
    c('PA1.SND.PRD.01','new',1,'Produce familiar words intelligibly','Evaluate actual contextual audio rather than transcription confidence.',['production','pronunciation']),
    c('PA1.SND.WRD.01','new',1,'Hear familiar word boundaries and stress','Locate a familiar chunk in short supported speech using reviewed stress models.',receptive),
    c('PA1.RDG.DEC.01','new',1,'Connect familiar written and spoken forms','Recognize familiar words and digits with support for different literacy starting points.',['listening','reading']),
    c('PA1.SOC.GRT.01','retained',1,'Recognize and use basic greetings','Recognize, respond, and initiate, recorded separately.'),
    c('PA1.SOC.GRT.02','retained',1,'Close a simple interaction','Choose a farewell appropriate to the established situation.'),
    c('PA1.SOC.COU.01','retained',1,'Use basic courtesy','Distinguish request markers, thanks, apologies, and attention-getting.'),
    c('PA1.SOC.INT.01','retained',2,'Give a name in interaction','Respond to an introduction or name request using real or fictional details.'),
    c('PA1.SOC.INT.02','retained',2,"Ask another person's name",'Initiate the question and use the answer.'),
    c('PA1.SOC.GRT.03','retained',2,'Ask how a familiar person is','Ask a wellbeing question rather than a name or age question.'),
    c('PA1.SOC.GRT.04','retained',2,'Respond about current state','Give a chosen state without forced positivity.'),
    c('PA1.SOC.RES.01','retained',2,'Acknowledge a first introduction','Respond reciprocally with suitable register.'),
    c('PA1.PER.NAM.01','retained',3,'State or confirm identity','Handle an identity check or correction separately from first introduction.'),
    c('PA1.PER.ORG.01','retained',3,'State origin','Keep origin separate from residence, citizenship, and current departure.'),
    c('PA1.PER.LOC.01','retained',3,'State current residence','Use a broad area or fictional city without exact address disclosure.'),
    c('PA1.PER.LNG.01','retained',3,'State language ability','Use positive, negative, and limited-ability chunks.'),
    c('PA1.PER.AGE.01','retained',3,'State an age','Use a supported number and age chunk with fictional details allowed.',communicative,[hard('PA1.SRV.NUM.01','The task must only use numbers already taught.')]),
    c('PA1.PER.ROL.01','new',3,'State a chosen role','Use a selected role rather than requiring employment disclosure.'),
    c('PA1.PER.IDN.01','retained',3,'Combine a short personal profile','Combine selected name, origin, residence, and language details.',[...communicative,...written],[recommended('PA1.SOC.INT.01','Name language supports a complete profile.'),recommended('PA1.PER.ORG.01','Origin is one optional profile detail.'),recommended('PA1.PER.LOC.01','Residence is one optional profile detail.'),recommended('PA1.PER.LNG.01','Language ability is one optional profile detail.')]),
    c('PA1.WRT.INF.01','new',3,'Enter simple personal information','Complete a short form from fictional role details; separate copying from independent writing.',written),
    c('PA1.WRT.MSG.01','new',3,'Produce a very short practical message','Write a greeting, chosen detail, request, or time/place chunk without a paragraph requirement.',written),
    c('PA1.WLD.NAM.01','retained',4,'Identify familiar people and relationships','Use family/social vocabulary in a fictional photo or social context.'),
    c('PA1.WLD.OBJ.01','retained',4,'Identify familiar objects','Name an object using supported noun and article chunks.'),
    c('PA1.WLD.POS.01','new',4,'Express basic possession','State, ask, and confirm possession with supplied objects.'),
    c('PA1.WLD.EXT.01','new',4,'State presence or absence','Use hay/no hay without confusing presence, naming, or location.'),
    c('PA1.WLD.COL.01','retained',4,'Identify or specify color','Select or correct a color with accessible labelled alternatives.'),
    c('PA1.WLD.DES.01','retained',4,'Describe a person or object with one feature','Use a familiar adjective with a clear referent and meaning-first correction.'),
    c('PA1.RDG.SGN.01','new',4,'Interpret familiar signs and labels','Choose an action from an illustrated familiar sign, label, or menu item.',['reading','pragmatics']),
    c('PA1.NED.WNT.01','retained',5,'Express an immediate want','Distinguish wanting an item now from generally liking it.'),
    c('PA1.NED.NED.01','retained',5,'Express a basic need','State a concrete need or request help without diagnostic language.'),
    c('PA1.NED.LIK.01','retained',5,'Express a basic preference','Use positive or negative singular and chunked activity preferences.'),
    c('PA1.NED.FOD.01','retained',5,'Request familiar food or drink','Complete an item request without requiring an infinitive construction.'),
    c('PA1.NED.REQ.01','retained',5,'Make a polite request','Request and clarify a concrete item with a suitable supported form.'),
    c('PA1.NED.ABL.01','new',5,'Express basic ability or inability','Use puedo/no puedo with one taught complement.'),
    c('PA1.NED.RES.01','new',5,'Accept or refuse an offer','Respond according to the role goal; polite refusal can succeed.'),
    c('PA1.ACT.RTN.01','new',5,'State a familiar action or routine','Use one or two reviewed action chunks without requiring a routine narrative.'),
    c('PA1.SRV.NUM.01','retained',6,'Use simple everyday numbers','Progress through 0–10, 11–20, mixed listening, quantities, and short digit strings.'),
    c('PA1.SRV.TIM.01','retained',6,'Understand basic time references','Use today, tomorrow, now, and familiar parts of day without clock grammar.'),
    c('PA1.SRV.CLK.01','new',6,'Use a supported whole hour','Separate current time from event time and use only taught numbers.',communicative,[hard('PA1.SRV.NUM.01','The selected whole-hour number must already be taught.')]),
    c('PA1.SRV.LOC.01','retained',6,'Ask where a familiar place or object is','Produce the location question and identify the requested referent.'),
    c('PA1.SRV.LOC.02','retained',6,'Understand simple location answers','Interpret here, there, near, far, and familiar supported location chunks.'),
    c('PA1.SRV.DIR.01','new',6,'Follow or give a very short supported route','Use one turn, then two familiar steps as extension, with a map or equivalent reference.',communicative,[hard('PA1.SRV.LOC.02','Route steps depend on the location chunks used by the task.')]),
    c('PA1.SRV.PAY.01','retained',6,'Handle a simple purchase','Ask price, understand and confirm an amount, then accept or decline.',communicative,[hard('PA1.SRV.NUM.01','The purchase must only use taught quantities and amounts.')]),
    c('PA1.INT.UND.01','retained',7,'Signal non-understanding','Distinguish lack of understanding from refusal.'),
    c('PA1.INT.REP.01','retained',7,'Request repetition','Request a repeat and then use the repeated information.'),
    c('PA1.INT.SLW.01','retained',7,'Request slower speech','Identify a speed-related breakdown and record whether slower delivery helps.'),
    c('PA1.INT.QUE.01','retained',7,'Ask what a word means','Repair an unknown meaning rather than rehearse generic question words.'),
    c('PA1.INT.CON.01','retained',7,'Confirm simple information','Accept, reject, or correct a specific proposition after understanding it.'),
    c('PA1.INT.QST.01','new',7,'Ask for a missing detail','Choose a taught what, who, where, when, or how-much question for the actual gap.'),
    c('PA1.INT.WRD.01','new',7,'Ask how to express an unknown word','Use ¿Cómo se dice...?, No sé, or request a moment with a supplied referent.'),
    c('PA1.RL.INT.01','retained',8,'Complete a reciprocal introduction','Combine greeting, identity question and answer, a chosen detail, and closure.',communicative,[hard('PA1.SOC.INT.01','The learner must be able to give a name.'),hard('PA1.SOC.INT.02','The learner must be able to ask a name.')]),
    c('PA1.RL.CAF.01','retained',8,'Complete a short café exchange','Request, handle one clarification or change, address amount if relevant, and close politely.'),
    c('PA1.RL.DIR.01','retained',8,'Ask for and use a simple location response','Reach an immediate familiar location using bounded cooperative repair.',communicative,[hard('PA1.SRV.LOC.01','The task requires a location question.'),hard('PA1.SRV.LOC.02','The task requires use of the answer.')]),
    c('PA1.RL.HEL.01','retained',8,'Request basic help','Gain attention, state a known need or detail, and use the offered help.'),
    c('PA1.RL.SOC.01','retained',8,'Sustain a brief social exchange','Respond contingently and take turns rather than reciting both sides.'),
    c('PA1.GAT.SUR.01','retained',9,'Demonstrate a basic survival interaction','Independently select known language for a bounded need or transaction.'),
    c('PA1.GAT.INT.01','retained',9,'Demonstrate conversation repair','Select an appropriate repair and use the clarified information.'),
    c('PA1.GAT.PRO.01','retained',9,'Demonstrate a personal profile','Use familiar facts in spoken and written form; PRO means profile.'),
    c('PA1.GAT.MIS.01','retained',9,'Demonstrate an integrated practical mission','Combine known abilities around a held-out but accessible goal.'),
] as const satisfies readonly CanonicalCompetency[]

export const PRE_A1_CODES = new Set(PRE_A1_REGISTRY.map(item => item.code))

export function validatePreA1Registry(registry: readonly CanonicalCompetency[] = PRE_A1_REGISTRY) {
    const errors: string[] = []
    const codes = new Set<string>()
    for (const item of registry) {
        if (codes.has(item.code)) errors.push(`${item.code}: duplicate canonical ID`)
        codes.add(item.code)
        if (!item.ability.trim() || !item.evidenceFocus.trim()) errors.push(`${item.code}: missing canonical definition`)
        if (!item.facets.length || !item.dimensions.length) errors.push(`${item.code}: missing evidence scope`)
    }
    for (const item of registry) for (const edge of item.prerequisites) {
        if (!codes.has(edge.code)) errors.push(`${item.code}: unknown prerequisite ${edge.code}`)
        if (edge.code === item.code) errors.push(`${item.code}: self prerequisite`)
        if (!edge.reason.trim()) errors.push(`${item.code}: prerequisite ${edge.code} has no reason`)
    }
    if (registry.length !== 60) errors.push(`Expected 60 canonical competencies, found ${registry.length}`)
    if (registry.filter(item => item.status === 'retained').length !== 44) errors.push('Expected 44 retained competencies')
    if (registry.filter(item => item.status === 'new').length !== 16) errors.push('Expected 16 new competencies')
    return { passed: errors.length === 0, errors }
}
