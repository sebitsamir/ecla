import { createHash } from 'node:crypto'

export type BenchmarkModality = 'listening' | 'speaking' | 'reading' | 'writing' | 'interaction'
export type BenchmarkCompetencyCode = 'PA1.SOC.GRT.01'|'PA1.NED.FOD.01'|'PA1.GAT.INT.01'
export type Assistance = 'replay' | 'captions' | 'visual_reference' | 'translation' | 'first_word_cue' | 'answer_model' | 'partner_rephrase'
export type BenchmarkTask = {
    id: string; stage: 'ENCOUNTER'|'UNDERSTAND'|'NOTICE'|'RECOGNIZE'|'RETRIEVE'|'PRODUCE'|'INTERACT'|'TRANSFER'|'RETAIN'
    modality: BenchmarkModality; prompt: string; accepted: string[]; model: string
    practicalOutcome: string; allowedAssistance: Assistance[]; scored: boolean
}
export type BenchmarkContext = {
    id: string; purpose: 'practice'|'transfer'; setting: string; partner: string; opening: string
    fingerprint: string; branch: { trigger: string; partnerResponse: string; learnerGoal: string }
    tasks: BenchmarkTask[]
}
export type BenchmarkPackage = {
    contract: 'ecla.benchmark/1'; version: string; slug: string; competencyCode: BenchmarkCompetencyCode; title: string
    knownLanguage: string[]; newProductiveLanguage: string[]; supportedReceptiveLanguage: string[]; incidentalLanguage: string[]
    scopeExclusions: string[]; practice: [BenchmarkContext,BenchmarkContext]; transfer: [BenchmarkContext,BenchmarkContext]
    remediation: { trigger: string; nextAction: string }[]
    retention: [{ delayDays:7; prompt:string; modality:BenchmarkModality },{ delayDays:30; prompt:string; modality:BenchmarkModality }]
    listeningProvenance: { status:'tts_fallback'; locale:string; speaker:string; reviewStatus:'pending' }[]
    accessibility: string[]; privacy: string[]; review: { educational:'pending'; cultural:'pending'; nativeSpeaker:'pending'; audio:'pending' }
}

const response = (id:string, stage:BenchmarkTask['stage'], modality:BenchmarkModality, prompt:string, accepted:string[], model:string, practicalOutcome:string, allowedAssistance:Assistance[] = ['replay','partner_rephrase']): BenchmarkTask => ({ id,stage,modality,prompt,accepted,model,practicalOutcome,allowedAssistance,scored:true })
const context = (id:string,purpose:'practice'|'transfer',setting:string,partner:string,opening:string,branch:BenchmarkContext['branch'],tasks:BenchmarkTask[]):BenchmarkContext => ({ id,purpose,setting,partner,opening,fingerprint:`${id}:${setting}:${partner}`,branch,tasks })
const base = (slug:string,competencyCode:BenchmarkCompetencyCode,title:string,knownLanguage:string[],newProductiveLanguage:string[],supportedReceptiveLanguage:string[]):Omit<BenchmarkPackage,'practice'|'transfer'|'remediation'|'retention'> => ({
    contract:'ecla.benchmark/1',version:'1.1.0',slug,competencyCode,title,knownLanguage,newProductiveLanguage,supportedReceptiveLanguage,incidentalLanguage:[],
    scopeExclusions:['Untaught grammar does not determine success.','Unsupported numbers and vocabulary do not determine success.','Native-like accent is not required.'],
    listeningProvenance:[{status:'tts_fallback',locale:'es-ES',speaker:'Lucía',reviewStatus:'pending'},{status:'tts_fallback',locale:'es-MX',speaker:'Mateo',reviewStatus:'pending'}],
    accessibility:['Every visual cue has equivalent text.','All audio can be replayed and captioned; each support use is recorded.','Keyboard and screen-reader operation are required.'],
    privacy:['No real name, address, age, or employment detail is required.','Raw audio requires explicit consent and a retention policy.'],
    review:{educational:'pending',cultural:'pending',nativeSpeaker:'pending',audio:'pending'},
})

export const BENCHMARK_PACKAGES: readonly BenchmarkPackage[] = [
    {
        ...base('greetings-first-contact','PA1.SOC.GRT.01','Greetings and initiating first contact',['Hola.'],['Buenos días.','Buenas tardes.','Buenas noches.'],['¡Buenas!','¿Qué tal?']),
        practice:[
            context('greeting-practice-neighbor','practice','apartment entrance · morning','neighbor','Buenos días.',{trigger:'The neighbor uses informal ¡Buenas! after the first greeting.',partnerResponse:'¡Buenas! ¿Qué tal?',learnerGoal:'Recognize the greeting and respond rather than reciting both turns.'},[
                response('recognize','RECOGNIZE','listening','Which opening did the neighbor use?',['Buenos días','buenos dias'],'Buenos días','Identify the greeting.'),
                response('speak','PRODUCE','speaking','Greet the neighbor for the morning.',['Buenos días','Hola, buenos días','Hola'],'Buenos días.','Open the exchange appropriately.'),
                response('write','PRODUCE','writing','Write a greeting for a morning message.',['Buenos días','Hola, buenos días','Hola'],'Hola, buenos días.','Send an appropriate opening.'),
                response('respond','INTERACT','interaction','The neighbor says “¡Buenas! ¿Qué tal?” Respond with a greeting and brief state.',['Hola, bien, gracias','Buenos días, bien, gracias','Bien, gracias'],'Hola, bien, gracias.','Acknowledge the partner and continue.'),
            ]),
            context('greeting-practice-class','practice','community class · afternoon','classmate','Hola.',{trigger:'The classmate waits instead of initiating.',partnerResponse:'[waits]',learnerGoal:'Initiate the greeting independently.'},[
                response('retrieve','RETRIEVE','speaking','Begin the interaction without a model.',['Hola','Buenas tardes','Hola, buenas tardes'],'Hola.','Initiate first contact.'),
                response('understand','UNDERSTAND','listening','The classmate replies “Buenas tardes.” Acknowledge the greeting.',['Hola','Buenas tardes','Igualmente'],'Buenas tardes.','Show the reply was understood.'),
                response('write','PRODUCE','writing','Write an afternoon greeting to a new classmate.',['Buenas tardes','Hola, buenas tardes','Hola'],'Hola, buenas tardes.','Open a short written exchange.'),
                response('branch','INTERACT','interaction','The classmate asks “¿Qué tal?” Give a short truthful or role-based response.',['Bien, gracias','Muy bien','Más o menos','Estoy bien','Estoy mal'],'Bien, gracias.','Respond contingently.'),
            ]),
        ],
        transfer:[
            context('greeting-transfer-hotel','transfer','hotel reception · late evening','receptionist','[looks up from the desk]',{trigger:'No greeting model is provided.',partnerResponse:'Buenas noches. ¿En qué puedo ayudar?',learnerGoal:'Choose an evening greeting and use the reply.'},[
                response('open','TRANSFER','speaking','Open the exchange at the late-evening reception.',['Buenas noches','Hola, buenas noches','Hola'],'Buenas noches.','Gain the receptionist’s attention.'),
                response('write','TRANSFER','writing','Write the same greeting in a late-arrival message.',['Buenas noches','Hola, buenas noches','Hola'],'Hola, buenas noches.','Open the arrival message.'),
                response('use-reply','INTERACT','interaction','The receptionist replies and offers help. Acknowledge before continuing.',['Sí, gracias','Gracias','Hola, gracias'],'Sí, gracias.','Use the partner’s reply.'),
            ]),
            context('greeting-transfer-library','transfer','library desk · early morning','librarian','[the librarian is arranging books]',{trigger:'The learner must initiate with a new partner.',partnerResponse:'Buenos días.',learnerGoal:'Initiate and recognize the returned greeting.'},[
                response('open','TRANSFER','speaking','Greet the librarian appropriately.',['Buenos días','Hola, buenos días','Hola'],'Buenos días.','Begin the service encounter.'),
                response('recognize','TRANSFER','listening','The librarian returns the greeting. What did you hear?',['Buenos días','buenos dias'],'Buenos días.','Identify the returned greeting.'),
                response('write','TRANSFER','writing','Write a greeting for a morning library message.',['Buenos días','Hola, buenos días','Hola'],'Hola, buenos días.','Open the message.'),
            ]),
        ],
        remediation:[{trigger:'Time-specific form is confused.',nextAction:'Return to a labelled morning/afternoon/evening contrast with one new productive chunk.'},{trigger:'The learner recites both roles.',nextAction:'Use a wait branch and score only the learner turn.'}],
        retention:[{delayDays:7,prompt:'Initiate with a new partner from an unlabelled time-of-day cue.',modality:'speaking'},{delayDays:30,prompt:'Recognize and initiate greetings in two new written and spoken contexts.',modality:'interaction'}],
    },
    {
        ...base('request-water-follow-up','PA1.NED.FOD.01','Requesting water and handling a follow-up',['Hola.','Por favor.','Gracias.'],['Agua, por favor.','Quiero agua.'],['¿Con gas o sin gas?','No hay agua fría.']),
        practice:[
            context('water-practice-cafe','practice','café counter','server','¿Qué quiere?',{trigger:'The server asks “¿Con gas o sin gas?”',partnerResponse:'¿Con gas o sin gas?',learnerGoal:'Choose an option and complete the request.'},[
                response('request','PRODUCE','speaking','Request water politely.',['Agua, por favor','Quiero agua, por favor','Quiero agua'],'Agua, por favor.','Make the intended item clear.'),
                response('write','PRODUCE','writing','Write the one-item order.',['Agua, por favor','Quiero agua, por favor','Quiero agua'],'Agua, por favor.','Submit the correct item request.'),
                response('follow-up','INTERACT','interaction','The server asks “¿Con gas o sin gas?” Choose still water.',['Sin gas, por favor','Sin gas'],'Sin gas, por favor.','Select the intended option.'),
                response('close','INTERACT','speaking','The server gives you the water. Close politely.',['Gracias','Muchas gracias'],'Gracias.','Complete the exchange.'),
            ]),
            context('water-practice-home','practice','friend’s home','host','¿Quieres algo?',{trigger:'Only juice is offered first.',partnerResponse:'¿Jugo?',learnerGoal:'Decline the offered item and restate the water request.'},[
                response('request','RETRIEVE','speaking','Ask for water.',['Agua, por favor','Quiero agua, por favor','Quiero agua'],'Agua, por favor.','Request the intended drink.'),
                response('correct','INTERACT','interaction','The host offers juice. Correct the item politely.',['No, gracias. Agua, por favor','No, quiero agua, por favor','Agua, por favor'],'No, gracias. Agua, por favor.','Reject the wrong item and preserve the goal.'),
                response('write','PRODUCE','writing','Write a short water request to the host.',['Agua, por favor','Quiero agua, por favor','Quiero agua'],'Quiero agua, por favor.','Make the request in writing.'),
            ]),
        ],
        transfer:[
            context('water-transfer-station','transfer','station kiosk','vendor','¿Qué necesita?',{trigger:'Cold water is unavailable.',partnerResponse:'No hay agua fría.',learnerGoal:'Accept room-temperature water or decline.'},[
                response('request','TRANSFER','speaking','Request water from the vendor.',['Agua, por favor','Quiero agua, por favor','Necesito agua'],'Agua, por favor.','Identify the wanted item.'),
                response('respond','TRANSFER','interaction','Cold water is unavailable. Accept regular water or decline.',['Sí, gracias','Agua está bien, gracias','No, gracias'],'Sí, gracias.','Reach a practical outcome.'),
                response('write','TRANSFER','writing','Write the item on a kiosk order slip.',['Agua','Agua, por favor'],'Agua.','Specify the item in a new modality.'),
            ]),
            context('water-transfer-clinic','transfer','clinic waiting area','assistant','¿Necesita algo?',{trigger:'The assistant asks how many bottles.',partnerResponse:'¿Una o dos?',learnerGoal:'Request one bottle using a taught number.'},[
                response('request','TRANSFER','speaking','Ask for water.',['Agua, por favor','Necesito agua, por favor','Quiero agua'],'Necesito agua, por favor.','State the need.'),
                response('quantity','TRANSFER','interaction','The assistant asks “¿Una o dos?” Choose one.',['Una, por favor','Una'],'Una, por favor.','Provide the requested quantity.'),
                response('write','TRANSFER','writing','Write the request and quantity for the assistant.',['Una agua, por favor','Agua, una, por favor','Una botella de agua, por favor'],'Una botella de agua, por favor.','Confirm the item and quantity in writing.'),
                response('close','TRANSFER','speaking','Acknowledge receiving it.',['Gracias','Muchas gracias'],'Gracias.','Complete the interaction.'),
            ]),
        ],
        remediation:[{trigger:'Learner uses a preference statement but no request.',nextAction:'Contrast me gusta agua with agua, por favor using an outcome-based choice.'},{trigger:'Follow-up is ignored.',nextAction:'Replay the follow-up with two labelled options, then remove labels.'}],
        retention:[{delayDays:7,prompt:'Request water and handle one new availability follow-up.',modality:'interaction'},{delayDays:30,prompt:'Complete a water request with a new partner and one quantity or type question.',modality:'speaking'}],
    },
    {
        ...base('repair-misunderstanding','PA1.GAT.INT.01','Repairing a misunderstanding',['No entiendo.'],['¿Puedes repetir?','Más despacio, por favor.','¿Qué significa…?'],['Claro.','Otra vez.','Quiere decir…']),
        practice:[
            context('repair-practice-repeat','practice','station desk','clerk','El tren sale del andén cuatro.',{trigger:'A key word is masked by noise.',partnerResponse:'Sale del andén cuatro.',learnerGoal:'Request repetition and then identify the platform.'},[
                response('select','RECOGNIZE','listening','The message was masked by noise. Choose the relevant repair.',['¿Puedes repetir?','Otra vez, por favor'],'¿Puedes repetir?','Request the missed message.'),
                response('produce','PRODUCE','speaking','Ask the clerk to repeat.',['¿Puedes repetir?','¿Puede repetir?','Otra vez, por favor'],'¿Puede repetir, por favor?','Trigger a repeat.'),
                response('write','PRODUCE','writing','Write the repetition request in station chat.',['¿Puedes repetir?','¿Puede repetir?','Otra vez, por favor'],'¿Puede repetir, por favor?','Request the repeat in writing.'),
                response('use','INTERACT','interaction','The clerk repeats “andén cuatro.” State the platform.',['Cuatro','Andén cuatro','El andén cuatro'],'Andén cuatro.','Use the clarified information.'),
            ]),
            context('repair-practice-speed','practice','video call','tutor','Primero abre el enlace y después confirma.',{trigger:'The words are familiar but arrive too quickly.',partnerResponse:'Abre el enlace. Después, confirma.',learnerGoal:'Request slower speech and carry out the sequence.'},[
                response('select','NOTICE','listening','You know the words but the speed is too high. Choose the repair.',['Más despacio, por favor','¿Puedes hablar más despacio?'],'Más despacio, por favor.','Identify a speed breakdown.'),
                response('produce','PRODUCE','speaking','Ask the tutor to slow down.',['Más despacio, por favor','¿Puedes hablar más despacio?'],'Más despacio, por favor.','Obtain slower delivery.'),
                response('use','INTERACT','interaction','After the slower version, state what happens first.',['Abre el enlace','Abrir el enlace','El enlace'],'Abre el enlace.','Use the repaired information.'),
                response('write','PRODUCE','writing','Write a polite speed request for the call chat.',['Más despacio, por favor','¿Puedes hablar más despacio?'],'Más despacio, por favor.','Request accessible pacing in writing.'),
            ]),
        ],
        transfer:[
            context('repair-transfer-meaning','transfer','small shop','clerk','Necesita el resguardo.',{trigger:'The word resguardo is unknown.',partnerResponse:'El recibo, el papel de la compra.',learnerGoal:'Ask meaning and use the explanation.'},[
                response('repair','TRANSFER','speaking','Ask what “resguardo” means.',['¿Qué significa resguardo?','¿Qué es resguardo?','No entiendo. ¿Qué significa resguardo?'],'¿Qué significa “resguardo”?','Obtain the missing meaning.'),
                response('use','TRANSFER','interaction','The clerk explains it means the receipt. Confirm what is needed.',['El recibo','Necesito el recibo','Sí, el recibo'],'El recibo.','Use the explanation.'),
                response('write','TRANSFER','writing','Write the meaning question in service chat.',['¿Qué significa resguardo?','¿Qué es resguardo?'],'¿Qué significa “resguardo”?','Repair the lexical gap in writing.'),
            ]),
            context('repair-transfer-confirm','transfer','bus stop','passenger','El autobús sale a las seis.',{trigger:'The learner hears either seis or siete.',partnerResponse:'A las seis.',learnerGoal:'Confirm the specific alternative and act on it.'},[
                response('confirm','TRANSFER','speaking','Confirm whether the bus leaves at six or seven.',['¿A las seis o a las siete?','¿A las seis?'],'¿A las seis o a las siete?','Resolve the ambiguous detail.'),
                response('use','TRANSFER','interaction','The passenger confirms six. State the departure time.',['A las seis','Seis'],'A las seis.','Use the confirmed information.'),
                response('write','TRANSFER','writing','Write the bounded confirmation question.',['¿A las seis o a las siete?','¿A las seis?'],'¿A las seis o a las siete?','Confirm through writing.'),
            ]),
        ],
        remediation:[{trigger:'Repair does not match the breakdown.',nextAction:'Contrast missing sound, excessive speed, unknown meaning, and uncertain proposition with one example each.'},{trigger:'Learner repairs but ignores the answer.',nextAction:'Require one practical action from the clarified detail before completion.'}],
        retention:[{delayDays:7,prompt:'Select and use a repair in a new breakdown, then act on the answer.',modality:'interaction'},{delayDays:30,prompt:'Repair two different unseen breakdown types without an answer model.',modality:'speaking'}],
    },
] as const

export function benchmarkVersion(item: BenchmarkPackage) { return createHash('sha256').update(JSON.stringify(item)).digest('hex') }
export function validateBenchmarkPackages(packages: readonly BenchmarkPackage[] = BENCHMARK_PACKAGES) {
    const errors:string[] = []; const slugs = new Set<string>(); const fingerprints = new Set<string>()
    for (const item of packages) {
        if (slugs.has(item.slug)) errors.push(`${item.slug}: duplicate package`); slugs.add(item.slug)
        if (item.practice.length !== 2 || item.transfer.length !== 2) errors.push(`${item.slug}: requires two practice and two transfer contexts`)
        if (item.newProductiveLanguage.length > 3) errors.push(`${item.slug}: exceeds the three-new-chunk authoring default`)
        if (item.retention.map(x=>x.delayDays).join(',') !== '7,30') errors.push(`${item.slug}: requires 7-day and 30-day retention checks`)
        for (const scene of [...item.practice,...item.transfer]) {
            if (fingerprints.has(scene.fingerprint)) errors.push(`${item.slug}: reused context fingerprint ${scene.fingerprint}`); fingerprints.add(scene.fingerprint)
            if (scene.purpose === 'transfer' && scene.tasks.some(task => task.stage !== 'TRANSFER' && task.stage !== 'INTERACT')) errors.push(`${scene.id}: held-out tasks must be transfer or contingent interaction`)
            const output = scene.tasks.filter(task => ['speaking','writing'].includes(task.modality))
            if (!output.some(task=>task.modality==='speaking') || !output.some(task=>task.modality==='writing')) errors.push(`${scene.id}: requires speaking and writing output opportunities`)
            if (!scene.branch.trigger.trim() || !scene.branch.partnerResponse.trim() || !scene.branch.learnerGoal.trim()) errors.push(`${scene.id}: incomplete contingent branch`)
            for (const task of scene.tasks) if (!task.accepted.length || !task.model.trim() || !task.practicalOutcome.trim()) errors.push(`${scene.id}/${task.id}: incomplete evaluation contract`)
        }
    }
    return { passed:errors.length===0, errors }
}
