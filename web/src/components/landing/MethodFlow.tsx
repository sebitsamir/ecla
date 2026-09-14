'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Eye, Grid, MessageCircle, RefreshCw, Repeat, Target, Users, Zap } from 'lucide-react'
import { StackedCardCarousel } from '@/components/ui'

const phases = [
  { name: 'Discover', detail: 'Meet the language and make sense of it.', stages: [
    { label: 'Encounter', detail: 'Meet language in context.', Icon: Eye }, { label: 'Understand', detail: 'Grasp meaning and structure.', Icon: Grid }, { label: 'Notice', detail: 'See patterns and connections.', Icon: Target },
  ] },
  { name: 'Build', detail: 'Bring language back and begin to shape it.', stages: [
    { label: 'Recognize', detail: 'Identify familiar language.', Icon: CheckCircle }, { label: 'Retrieve', detail: 'Bring it back from memory.', Icon: RefreshCw }, { label: 'Produce', detail: 'Say and write with support.', Icon: Zap },
  ] },
  { name: 'Use', detail: 'Communicate in new situations and retain it.', stages: [
    { label: 'Interact', detail: 'Use it with another person.', Icon: Users }, { label: 'Transfer', detail: 'Apply it to a new situation.', Icon: Repeat }, { label: 'Retain', detail: 'Keep it available over time.', Icon: MessageCircle },
  ] },
]

export default function MethodFlow() {
  const [phase, setPhase] = useState(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive(value => phase * 3 + ((value - phase * 3 + 1) % 3)), 2200)
    return () => window.clearInterval(timer)
  }, [phase])

  return <StackedCardCarousel items={phases} getKey={item => item.name} getLabel={item => `${item.name} phase`} label="One connected learning journey" desktopColumnsClassName="sm:grid-cols-3" mobileHeight="25rem" cardHeight="24rem" onActiveChange={index => { setPhase(index); setActive(index * 3) }} renderCard={(item, phaseIndex) => <div className="h-full">
    <header className="border-b border-line bg-surface px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-ember-soft">Phase {phaseIndex + 1}</p><h3 className="font-display mt-1 text-2xl text-ivory">{item.name}</h3><p className="mt-1 text-xs leading-5 text-stone">{item.detail}</p></header>
    <ol className="p-2">{item.stages.map(({ label, detail, Icon }, stageIndex) => {
      const index = phaseIndex * 3 + stageIndex; const selected = active === index
      return <li key={label}><button type="button" onClick={() => { setPhase(phaseIndex); setActive(index) }} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} aria-pressed={selected} className={`ecla-control grid min-h-[4.65rem] w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 rounded-control px-3 text-left ${selected ? 'bg-ember/[.1]' : 'hover:bg-surface'}`}><span className={`flex size-9 items-center justify-center rounded-full border transition-colors duration-300 ${selected ? 'border-ember bg-ember text-obsidian' : 'border-line-strong bg-carbon text-stone'}`}><Icon className="size-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-ivory">{index + 1}. {label}</span><span className="mt-0.5 block text-xs leading-5 text-stone">{detail}</span></span></button></li>
    })}</ol>
  </div>} />
}
