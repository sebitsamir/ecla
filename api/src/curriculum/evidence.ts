import { Prisma, type PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { PRE_A1_CURRICULUM_VERSION } from '../../prisma/content/spanish/pre-a1/registry'

const assistance = z.enum(['replay','captions','visual_reference','translation','first_word_cue','answer_model','partner_rephrase'])
export const evidenceObservationSchema = z.object({
    userId:z.string().min(1), competencyCode:z.string().min(1), competencyVersion:z.literal(PRE_A1_CURRICULUM_VERSION),
    taskVersion:z.string().min(1), contentVersion:z.string().min(1), contextFingerprint:z.string().min(1),
    modality:z.enum(['listening','speaking','reading','writing','interaction']), rawResponseRef:z.string().min(1).nullable(),
    allowedAssistance:z.array(assistance), usedAssistance:z.array(assistance),
    outcome:z.object({ achieved:z.boolean(), score:z.number().min(0).max(100), practicalResult:z.string().min(1) }).strict(),
    rubricVersion:z.string().min(1), evaluatorVersion:z.string().min(1), confidence:z.number().min(0).max(1),
    purpose:z.enum(['practice','transfer','retention']), reviewState:z.enum(['unreviewed','reviewed','rejected']), observedAt:z.coerce.date(),
}).strict().superRefine((item,ctx)=>{
    for (const used of item.usedAssistance) if (!item.allowedAssistance.includes(used)) ctx.addIssue({code:'custom',message:`Used assistance ${used} was not allowed`})
    if (item.modality==='speaking' && item.outcome.achieved && !item.rawResponseRef) ctx.addIssue({code:'custom',message:'Speaking evidence requires a consented raw observation reference'})
})
export type EvidenceObservationInput = z.input<typeof evidenceObservationSchema>

export async function recordEvidenceObservation(db:PrismaClient,input:EvidenceObservationInput) {
    const parsed = evidenceObservationSchema.parse(input)
    const competency = await db.competency.findUnique({where:{code:parsed.competencyCode},select:{id:true}})
    if (!competency) throw new Error(`Unknown competency ${parsed.competencyCode}`)
    return db.evidenceObservation.create({data:{
        userId:parsed.userId,competencyId:competency.id,competencyVersion:parsed.competencyVersion,taskVersion:parsed.taskVersion,
        contentVersion:parsed.contentVersion,contextFingerprint:parsed.contextFingerprint,modality:parsed.modality,rawResponseRef:parsed.rawResponseRef,
        allowedAssistance:parsed.allowedAssistance,usedAssistance:parsed.usedAssistance,outcome:parsed.outcome as Prisma.InputJsonValue,
        rubricVersion:parsed.rubricVersion,evaluatorVersion:parsed.evaluatorVersion,confidence:parsed.confidence,purpose:parsed.purpose,
        reviewState:parsed.reviewState,observedAt:parsed.observedAt,
    }})
}

export function retentionEligibility(observations: Array<{ purpose:string; outcome:unknown; observedAt:Date }>, now:Date) {
    const successfulTransfer = observations.filter(item=>item.purpose==='transfer' && typeof item.outcome==='object' && item.outcome !== null && (item.outcome as {achieved?:boolean}).achieved).sort((a,b)=>b.observedAt.getTime()-a.observedAt.getTime())[0]
    if (!successfulTransfer) return { day7:false,day30:false,reason:'A successful held-out transfer is required first.' }
    const elapsed = now.getTime()-successfulTransfer.observedAt.getTime()
    return { day7:elapsed>=7*86400000,day30:elapsed>=30*86400000,reason:null }
}
