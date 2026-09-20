import { GOLDEN_CONTRACT } from '../../../packages/contracts/golden'
import { BENCHMARK_PACKAGES, type BenchmarkTask } from '../curriculum/benchmarks'
import { EVALUATOR_VERSION, type GoldenDefinition } from './definition'

const dimension = (task:BenchmarkTask):'comprehension'|'retrieval'|'production'|'interaction'|'transfer'|'retention' => {
    if (task.stage==='TRANSFER') return 'transfer'
    if (task.stage==='RETAIN') return 'retention'
    if (task.stage==='INTERACT') return 'interaction'
    if (task.stage==='RETRIEVE') return 'retrieval'
    if (task.stage==='PRODUCE') return 'production'
    return 'comprehension'
}

/** Server-owned assessment definitions. Accepted answers and models never enter scene delivery. */
export function benchmarkGoldenScenes() {
    return BENCHMARK_PACKAGES.filter(item=>item.competencyCode!=='PA1.SOC.GRT.01').flatMap(item=>{
        const contexts=[...item.practice,...item.transfer].map(scene=>({
            slug:`benchmark-${item.slug}-${scene.id}`,
            definition:{ contract:GOLDEN_CONTRACT,competencyCode:item.competencyCode,title:item.title,setting:scene.setting,contextFingerprint:scene.fingerprint,purpose:scene.purpose,evaluatorVersion:EVALUATOR_VERSION,culturalNote:'Independent cultural and native-speaker review remains pending.',steps:scene.tasks.map(task=>({id:task.id,stage:task.stage,kind:'response' as const,prompt:task.prompt,audio:{status:'tts_fallback' as const,locale:'es-ES',rate:.9},accepted:task.accepted,dimension:dimension(task),repair:item.competencyCode==='PA1.GAT.INT.01'&&task.stage==='INTERACT',model:task.model})) } satisfies GoldenDefinition,
        }))
        const retention=item.retention.map(check=>({
            slug:`benchmark-${item.slug}-retention-${check.delayDays}`,
            definition:{contract:GOLDEN_CONTRACT,competencyCode:item.competencyCode,title:`${item.title} · ${check.delayDays}-day return`,setting:'Delayed independent check',contextFingerprint:`${item.slug}:retention:${check.delayDays}`,purpose:'retention' as const,retentionDelayDays:check.delayDays,evaluatorVersion:EVALUATOR_VERSION,culturalNote:'Independent review remains pending.',steps:[
                {id:'recall',stage:'RETAIN',kind:'response' as const,prompt:check.prompt,audio:{status:'tts_fallback' as const,locale:'es-ES',rate:.9},accepted:[...item.newProductiveLanguage,...item.knownLanguage],dimension:'retention' as const,repair:false,model:item.newProductiveLanguage[0]},
                {id:'retrieve',stage:'RETRIEVE',kind:'response' as const,prompt:'Use one other appropriate familiar chunk for this goal.',audio:{status:'tts_fallback' as const,locale:'es-MX',rate:1},accepted:[...item.newProductiveLanguage,...item.knownLanguage],dimension:'retrieval' as const,repair:false,model:item.newProductiveLanguage.at(-1)!},
                {id:'confirm',stage:'INTERACT',kind:'response' as const,prompt:'Confirm or close the exchange appropriately.',audio:{status:'tts_fallback' as const,locale:'es-ES',rate:.95},accepted:item.competencyCode==='PA1.NED.FOD.01'?['Gracias','Sí, gracias','No, gracias']:['Gracias','Sí','Vale','De acuerdo','Hola'],dimension:'interaction' as const,repair:item.competencyCode==='PA1.GAT.INT.01',model:'Gracias.'},
            ]} satisfies GoldenDefinition,
        }))
        return [...contexts,...retention]
    })
}
