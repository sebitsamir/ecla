'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronDown, Lock, MapPin } from 'lucide-react'
import { sceneTitleFor } from '@/content/sceneTitles'
import { journeyUnitArtwork } from '@/lib/journeyPresentation'

export type CourseCompetency = {
    id: string | number
    code: string
    title?: string | null
    canDo?: string | null
    status: string
    href?: string
    prerequisites?: string[]
    patterns?: string[]
    evidence?: {
        comprehension?: number | null
        retrieval?: number | null
        interaction?: number | null
        application?: number | null
        transfer?: number | null
        retention?: number | null
    } | null
}

export type CourseUnit = {
    id: string | number
    title: string
    description?: string | null
    counts?: { mastered?: number; developing?: number; upcoming?: number; locked?: number } | null
    competencies?: CourseCompetency[] | null
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'mastered') return <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-obsidian shadow-[0_0_20px_rgba(120,173,130,.2)]"><Check className="size-4" strokeWidth={3} /></span>
    if (status === 'developing') return <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-ember bg-ember/10"><span className="absolute inset-0 animate-pulse-ring rounded-full border border-ember/35" /><span className="size-2.5 rounded-full bg-ember" /></span>
    if (status === 'locked') return <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-ash"><Lock className="size-3.5" /></span>
    return <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-carbon"><span className="size-2 rounded-full bg-stone" /></span>
}

export default function StageCard({ unit, index, defaultOpen = false, onSelect }: {
    unit: CourseUnit
    index: number
    defaultOpen?: boolean
    onSelect?: (comp: CourseCompetency) => void
}) {
    const router = useRouter()
    const [open, setOpen] = useState(defaultOpen)
    const counts = unit.counts ?? {}
    const list = unit.competencies ?? []
    const complete = counts.mastered ?? 0
    const total = list.length
    const progress = total > 0 ? Math.round((complete / total) * 100) : 0
    const artwork = journeyUnitArtwork(unit.title, index)

    return <li className="relative max-w-full min-w-0 overflow-hidden pl-11 sm:pl-14 xl:pl-16">
        <div aria-hidden className="absolute bottom-[-1.5rem] left-[1.15rem] top-0 w-px bg-gradient-to-b from-ember/70 via-line-strong to-line sm:left-[1.4rem] xl:left-[1.55rem]" />
        <span aria-hidden className={`absolute left-0 top-7 z-10 flex size-9 items-center justify-center rounded-full border text-xs font-semibold shadow-[0_0_0_6px_#09090a] sm:top-8 sm:size-11 xl:size-12 xl:text-sm ${complete === total && total > 0 ? 'border-success/50 bg-success text-obsidian' : open ? 'border-ember bg-ember text-obsidian' : 'border-line-strong bg-carbon text-stone'}`}>{complete === total && total > 0 ? <Check className="size-4 xl:size-5" /> : index + 1}</span>
        <button onClick={() => setOpen(value => !value)} aria-expanded={open} className={`ecla-control group relative block w-full max-w-full min-w-0 overflow-hidden rounded-experience border text-left shadow-glow-md ${open ? 'border-ember/40 bg-carbon' : 'border-line bg-carbon hover:border-line-strong'}`}>
            <span className="relative flex min-h-48 items-end sm:min-h-44 xl:min-h-48">
                <Image src={artwork.src} alt={artwork.alt} fill sizes="(max-width: 640px) calc(100vw - 4.5rem), (max-width: 1279px) calc(100vw - 7rem), 720px" className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.025]" />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,10,.08)_0%,rgba(9,9,10,.48)_42%,rgba(9,9,10,.96)_100%)]" />
                <span className="relative flex min-w-0 flex-1 items-end gap-3 p-4 sm:p-4 xl:gap-4 xl:p-5">
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-ember-soft sm:text-[10px]"><MapPin className="size-3 shrink-0" />Unit {String(index + 1).padStart(2, '0')}</span><span className="font-display mt-1.5 block min-h-11 break-words text-lg leading-tight text-ivory sm:min-h-12 sm:text-xl xl:min-h-14 xl:text-2xl">{unit.title}</span><span className="mt-1 block min-h-16 break-words text-xs leading-4 text-ivory/70 sm:min-h-8">{unit.description ?? '\u00a0'}</span>
                    <span className="mt-2.5 flex items-center gap-2 sm:mt-3"><span className="h-1 flex-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-success" style={{width: `${progress}%`}} /></span><span className="text-[10px] tabular-nums text-ivory/60">{complete}/{total}</span></span></span>
                    <ChevronDown className={`mb-1 size-5 shrink-0 text-ivory/70 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </span>
            </span>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-500 [transition-timing-function:var(--ecla-ease)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="min-w-0 overflow-hidden"><ol className="min-w-0 space-y-2 py-3">
                {list.map((competency, itemIndex) => {
                    const clickable = competency.status !== 'locked'
                    const sceneTitle = sceneTitleFor(competency.code, competency.title ?? competency.canDo)
                    const href = competency.href ?? `/learn/${competency.id}?mode=STORY`
                    const supportingText = competency.canDo && competency.canDo !== sceneTitle ? competency.canDo : '\u00a0'
                    return <li key={competency.id} className="min-w-0"><button onClick={() => { if (!clickable) return; onSelect?.(competency); router.push(href) }} disabled={!clickable} aria-disabled={!clickable} className={`ecla-control flex min-h-28 w-full min-w-0 items-center gap-3 overflow-hidden rounded-surface border p-3 text-left sm:p-3.5 ${clickable ? 'border-line bg-surface hover:border-ember/40 hover:bg-surface-raised' : 'cursor-not-allowed border-line/60 bg-surface/40 opacity-50'}`}>
                        <StatusIcon status={competency.status} /><span className="min-w-0 flex-1"><span className="block break-all text-[9px] font-semibold uppercase tracking-[.12em] text-ash sm:text-[10px]">Step {itemIndex + 1} · {competency.code}</span><span className="mt-1 block break-words text-sm font-medium leading-snug text-ivory">{sceneTitle}</span><span className="mt-1 block min-h-4 break-words text-xs leading-4 text-stone">{supportingText}</span></span>{clickable ? <ArrowRight className="size-4 shrink-0 text-ember-soft" /> : null}
                    </button></li>
                })}
            </ol></div>
        </div>
    </li>
}
