'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { fetchMemory, type CharacterMemory } from '@/lib/memory'

export default function RelationshipsCard({ getToken }: { getToken: () => Promise<string | null> }) {
    const [characters, setCharacters] = useState<CharacterMemory[] | null>(null)
    useEffect(() => { let active = true; fetchMemory(getToken).then(value => { if (active) setCharacters(value?.characters ?? []) }); return () => { active = false } }, [getToken])
    return <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-widest text-cream/50">People you’ve met</p><Users className="h-4 w-4 text-glow" /></div>
        {characters === null ? <p role="status" className="text-sm text-cream/50">Remembering your conversations…</p> : characters.length === 0 ? <p className="text-sm leading-relaxed text-cream/60">Your first completed conversation will begin a relationship here.</p> : <div className="space-y-3">{characters.slice(0, 3).map(person => <div key={person.characterId} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-glow/10 font-bold uppercase text-glow">{[...person.characterId][0]}</span><div className="min-w-0"><p className="capitalize text-sm font-semibold text-cream">{person.characterId}</p><p className="truncate text-xs text-cream/50">{person.relationship ?? 'stranger'} · met {person.encounters} {person.encounters === 1 ? 'time' : 'times'}{person.meta?.location ? ` · ${person.meta.location}` : ''}</p></div></div>)}</div>}
    </section>
}
