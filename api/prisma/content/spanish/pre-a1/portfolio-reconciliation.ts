import type { PreA1Context, PreA1PortfolioEntry } from './portfolio-types'

const cx = (slug:string,setting:string,partner:string,opening:string,learnerGoal:string,variation:string):PreA1Context=>({slug,setting,partner,opening,learnerGoal,variation})
const recode = (item:PreA1PortfolioEntry,code:string):PreA1PortfolioEntry=>{
    const prefix=`${code.toLowerCase().replaceAll('.','-')}-`
    return {...item,code,contexts:item.contexts.map(context=>({...context,slug:`${prefix}${context.slug}`})) as PreA1PortfolioEntry['contexts'],transfer:{...item.transfer,contextSlug:`${prefix}${item.transfer.contextSlug}`}}
}
const revise = (base:PreA1PortfolioEntry, update:Partial<PreA1PortfolioEntry>):PreA1PortfolioEntry=>({...base,...update,culture:{...base.culture,...update.culture}})

/** Corrects known semantic conflicts in authored drafts. Review states remain unchanged. */
export function reconcileRetainedPortfolio(entries:readonly PreA1PortfolioEntry[]):PreA1PortfolioEntry[] {
    const byCode=new Map(entries.map(item=>[item.code,item]))
    const get=(code:string)=>{const item=byCode.get(code);if(!item)throw new Error(`Missing retained portfolio ${code}`);return item}
    const replacements=new Map<string,PreA1PortfolioEntry>()
    replacements.set('PA1.WLD.OBJ.01',recode(get('PA1.WLD.NAM.01'),'PA1.WLD.OBJ.01'))
    replacements.set('PA1.SRV.LOC.02',recode(get('PA1.SRV.LOC.01'),'PA1.SRV.LOC.02'))
    replacements.set('PA1.GAT.PRO.01',recode(get('PA1.GAT.INT.01'),'PA1.GAT.PRO.01'))
    replacements.set('PA1.GAT.SUR.01',recode(get('PA1.GAT.PRO.01'),'PA1.GAT.SUR.01'))
    replacements.set('PA1.GAT.INT.01',recode(get('PA1.GAT.SUR.01'),'PA1.GAT.INT.01'))
    replacements.set('PA1.PER.IDN.01',revise(get('PA1.PER.IDN.01'),{
        realization:{core:['Me llamo… Soy de… Vivo en… Hablo…'],acceptedMeaningVariants:['Soy… Vivo en… Hablo…']},
        contexts:[cx('profile-card','profile card','reader','Cuéntame sobre ti.','Give selected name, origin, residence, and language details.','Age and employment are optional.'),cx('community-intro','community group','facilitator','Preséntate brevemente.','Combine two or three safe personal details.','Question order changes.'),cx('audio-profile','audio profile','listener','¿Quién eres?','Record a short profile without a model.','No immediate partner cues are available.')],
        production:{spoken:'Give a short profile with chosen familiar facts.',written:'Write a short profile using safe real or fictional details.'}, interaction:'Respond to one follow-up by repeating or correcting the requested profile detail.',
        transfer:{contextSlug:'audio-profile',novelty:'Integrate selected facts asynchronously without a sentence model.'},
        retention:{delayHours:168,prompt:'After seven days, create a fresh short profile from new fictional details.'},
        culture:{note:'Learners control disclosure and may use fictional names, places, and language profiles.',review:get('PA1.PER.IDN.01').culture.review},
    }))
    replacements.set('PA1.WLD.NAM.01',revise(get('PA1.WLD.NAM.01'),{
        realization:{core:['Es mi madre/padre/amigo/amiga.'],acceptedMeaningVariants:['Es mi familia.','Es una amiga/un amigo.']},
        contexts:[cx('family-photo','photo album','friend','¿Quién es?','Identify a familiar person or relationship.','The image uses a fictional family.'),cx('contact-list','phone contacts','classmate','¿Quién es Ana?','Identify a social relationship.','No photo is available.'),cx('event-photo','community photo','host','¿Quiénes son?','Identify one person in a new social scene.','Several people are pictured.')],
        production:{spoken:'Identify one fictional familiar person and relationship.',written:'Label one person in a fictional social photo.'}, interaction:'Answer who the person is and ask about one other person.',
        transfer:{contextSlug:'event-photo',novelty:'New social image and several possible referents.'},
        retention:{delayHours:168,prompt:'After seven days, identify relationships in an unseen fictional photo.'},
        culture:{note:'Family and relationship terms vary; tasks use fictional people and inclusive chosen relationships.',review:get('PA1.WLD.NAM.01').culture.review},
    }))
    replacements.set('PA1.SRV.TIM.01',revise(get('PA1.SRV.TIM.01'),{
        realization:{core:['hoy','mañana','ahora','por la mañana/tarde/noche'],acceptedMeaningVariants:['esta mañana','esta tarde','esta noche']},
        contexts:[cx('today-plan','message','friend','¿Hoy o mañana?','Choose the intended day reference.','The event changes.'),cx('now-later','service desk','clerk','¿Ahora?','Confirm now or later.','The learner role must wait.'),cx('day-part','community schedule','organizer','Es por la tarde.','Interpret the familiar part of day.','No clock time is required.')],
        production:{spoken:'State a familiar day or part-of-day reference.',written:'Write whether the event is today or tomorrow.'}, interaction:'Confirm the relevant time reference and use it in the plan.',
        transfer:{contextSlug:'day-part',novelty:'New schedule with no whole-hour language.'},
        retention:{delayHours:168,prompt:'After seven days, interpret today, tomorrow, now, and a familiar part of day.'},
        culture:{note:'Daily schedules vary; this objective does not assess clock-time grammar.',review:get('PA1.SRV.TIM.01').culture.review},
    }))
    replacements.set('PA1.SRV.LOC.01',revise(get('PA1.SRV.LOC.01'),{
        realization:{core:['¿Dónde está + lugar/objeto?'],acceptedMeaningVariants:['¿Dónde está el baño?','¿Dónde está la entrada?']},
        contexts:[cx('building-question','public building','staff','¿En qué puedo ayudar?','Ask where a familiar place is.','The requested place changes.'),cx('shop-question','shop','clerk','¿Qué busca?','Ask where a familiar object is.','The object is visible on a reference card.'),cx('station-question','station','traveler','Buenos días.','Initiate a location question with a new partner.','No question model is shown.')],
        production:{spoken:'Ask where the supplied familiar place or object is.',written:'Write one location question.'}, interaction:'Ask the question, identify the requested referent, and acknowledge the answer.',
        transfer:{contextSlug:'station-question',novelty:'New partner and learner-initiated question without a model.'},
        retention:{delayHours:168,prompt:'After seven days, ask two new location questions independently.'},
        culture:{note:'Location questions can use supplied fictional places; no exact home location is requested.',review:get('PA1.SRV.LOC.01').culture.review},
    }))
    replacements.set('PA1.INT.QUE.01',revise(get('PA1.INT.QUE.01'),{
        realization:{core:['¿Qué significa + palabra?'],acceptedMeaningVariants:['¿Qué quiere decir + palabra?','¿Qué es + palabra?']},
        contexts:[cx('class-meaning','classroom','teacher','Necesita un bolígrafo.','Ask what bolígrafo means.','A visual answer follows.'),cx('shop-meaning','shop','clerk','Guarde el resguardo.','Ask about the unknown word.','The explanation uses a familiar synonym.'),cx('message-meaning','service chat','agent','Adjunte el comprobante.','Ask for the meaning in writing.','No gesture is available.')],
        production:{spoken:'Ask what the supplied unfamiliar word means.',written:'Write a meaning-clarification question.'}, interaction:'Ask the meaning and use the explanation in the next action.',
        transfer:{contextSlug:'message-meaning',novelty:'New unknown word and written-only support.'},
        retention:{delayHours:168,prompt:'After seven days, ask about and use the meaning of a new supplied word.'},
        culture:{note:'Unknown words are normal; asking meaning is collaborative rather than a failure.',review:get('PA1.INT.QUE.01').culture.review},
    }))
    return entries.map(item=>replacements.get(item.code)??item)
}
