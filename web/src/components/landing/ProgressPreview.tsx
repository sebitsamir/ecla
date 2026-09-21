'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Headphones, MessageCircle, Mic, RefreshCw, type LucideIcon } from 'lucide-react'

type Dimension = { name: string; description: string; Icon: LucideIcon; position: string }

const dimensions: Dimension[] = [
  { name: 'Understanding', description: 'Follow meaning in speech and text.', Icon: Headphones, position: 'left-1/2 top-1 -translate-x-1/2' },
  { name: 'Retrieval', description: 'Bring language back without being shown.', Icon: RefreshCw, position: 'right-0 top-[30%]' },
  { name: 'Production', description: 'Express an intended meaning in your own words.', Icon: Mic, position: 'bottom-4 right-[7%]' },
  { name: 'Retention', description: 'Keep language available as time passes.', Icon: BookOpen, position: 'bottom-4 left-[7%]' },
  { name: 'Interaction', description: 'Respond, clarify, and keep an exchange moving.', Icon: MessageCircle, position: 'left-0 top-[30%]' },
]

export default function ProgressPreview() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive(value => (value + 1) % dimensions.length), 2800)
    return () => window.clearInterval(timer)
  }, [])

  const selected = dimensions[active]
  const SelectedIcon = selected.Icon

  return (
    <div className="grid gap-3 lg:grid-cols-[1.06fr_0.94fr]">
      <section className="overflow-hidden rounded-[24px] border border-line bg-ink p-5 sm:p-7">
        <div className="flex flex-col gap-1 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-ivory">Ability profile</p><p className="mt-1 text-xs text-stone">Explore the signals Ecla keeps separate.</p></div>
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ember-soft sm:mt-0">Evidence over activity</span>
        </div>
        <div className="mt-4 space-y-1">
          {dimensions.map(({ name, description, Icon }, index) => {
            const isActive = active === index
            return <button key={name} type="button" onClick={() => setActive(index)} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} aria-pressed={isActive} className={`ecla-control grid min-h-[4.4rem] w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 rounded-control px-3 text-left ${isActive ? 'bg-ember/[.1]' : 'hover:bg-surface'}`}>
              <span className={`flex size-9 items-center justify-center rounded-full border ${isActive ? 'border-ember bg-ember text-obsidian' : 'border-line-strong bg-carbon text-stone'}`}><Icon className="size-4" /></span>
              <span className="min-w-0"><span className="flex items-center justify-between gap-3"><strong className="text-sm text-ivory">{name}</strong><span className={`h-1.5 w-16 overflow-hidden rounded-full bg-line ${isActive ? '' : 'opacity-45'}`}><span className={`block h-full w-1/3 rounded-full bg-ember ${isActive ? 'ecla-signal-runner' : ''}`} /></span></span><span className="mt-1 block text-xs leading-5 text-stone">{description}</span></span>
            </button>
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-line bg-ink p-5 sm:p-7">
        <div className="border-b border-line pb-5"><p className="text-sm font-semibold text-ivory">What progress means</p><p className="mt-1 text-xs text-stone">Select any ability to see its role.</p></div>
        <div className="relative mx-auto mt-7 aspect-square max-w-[320px]">
          <div key={selected.name} className="ecla-reveal absolute left-1/2 top-1/2 z-10 grid size-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ember/40 bg-surface p-4 text-center shadow-glow-md">
            <div><SelectedIcon className="mx-auto size-5 text-ember-soft" /><span className="font-display mt-2 block text-2xl text-ivory">{selected.name}</span><span className="mt-1 block text-[11px] leading-4 text-stone">{selected.description}</span></div>
          </div>
          {dimensions.map(({ name, Icon, position }, index) => <button key={name} type="button" onClick={() => setActive(index)} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} aria-label={`Explore ${name}`} aria-pressed={active === index} className={`ecla-control absolute z-20 flex size-12 items-center justify-center rounded-full border ${position} ${active === index ? 'border-ember bg-ember text-obsidian shadow-glow-md' : 'border-line-strong bg-carbon text-stone hover:border-ember/50 hover:text-ivory'}`}><Icon className="size-4" /></button>)}
          <svg className="absolute inset-0 h-full w-full text-line-strong" viewBox="0 0 320 320" aria-hidden="true"><line x1="160" y1="160" x2="160" y2="30" stroke="currentColor" /><line x1="160" y1="160" x2="287" y2="115" stroke="currentColor" /><line x1="160" y1="160" x2="245" y2="280" stroke="currentColor" /><line x1="160" y1="160" x2="75" y2="280" stroke="currentColor" /><line x1="160" y1="160" x2="33" y2="115" stroke="currentColor" /></svg>
        </div>
      </section>
    </div>
  )
}
