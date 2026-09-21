import assert from 'node:assert/strict'
import test from 'node:test'
import { evidenceObservationSchema, retentionEligibility } from '../src/curriculum/evidence'

const base = { userId:'user',competencyCode:'PA1.SOC.GRT.01',competencyVersion:'1.1.0',taskVersion:'task/1',contentVersion:'content/1',contextFingerprint:'hotel-evening',modality:'interaction',rawResponseRef:null,allowedAssistance:['replay'],usedAssistance:[],outcome:{achieved:true,score:90,practicalResult:'Greeting acknowledged'},rubricVersion:'rubric/1',evaluatorVersion:'evaluator/1',confidence:.9,purpose:'transfer',reviewState:'unreviewed',observedAt:new Date('2026-01-01T00:00:00Z') } as const
test('evidence contract rejects unallowed support and unsupported spoken claims',()=>{
    assert.equal(evidenceObservationSchema.safeParse(base).success,true)
    assert.equal(evidenceObservationSchema.safeParse({...base,usedAssistance:['translation']}).success,false)
    assert.equal(evidenceObservationSchema.safeParse({...base,modality:'speaking'}).success,false)
})
test('retention eligibility opens at seven and thirty days after successful transfer',()=>{
    const history=[{purpose:'transfer',outcome:{achieved:true},observedAt:new Date('2026-01-01T00:00:00Z')}]
    assert.deepEqual(retentionEligibility(history,new Date('2026-01-08T00:00:00Z')),{day7:true,day30:false,reason:null})
    assert.deepEqual(retentionEligibility(history,new Date('2026-01-31T00:00:00Z')),{day7:true,day30:true,reason:null})
})
