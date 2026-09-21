'use client'

import { useEffect, useState } from 'react'
import { Headphones, MessageCircle, RefreshCw, type LucideIcon } from 'lucide-react'

type Stage = { title: string; detail: string; Icon: LucideIcon }

const stages: Stage[] = [
  { title: 'Listen in context', detail: 'Meet Spanish inside a real situation, with meaning you can follow.', Icon: Headphones },
  { title: 'Respond naturally', detail: 'Speak or type in your own words. Support appears when it is useful.', Icon: MessageCircle },
  { title: 'Return at the right time', detail: 'Practice comes back when your evidence shows that memory needs it.', Icon: RefreshCw },
]

export default function JourneyPreview({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive(value => (value + 1) % stages.length), 3200)
    return () => window.clearInterval(timer)
  }, [])

  const stage = stages[active]
  const Icon = stage.Icon

  return (
    <div className={`ecla-theme-panel rounded-experience border border-line bg-ink/95 shadow-glow-md backdrop-blur-xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-ember-soft">How a session moves</p>
        <span className="text-xs tabular-nums text-ash">0{active + 1} / 03</span>
      </div>
      <div key={stage.title} className={`ecla-reveal ${compact ? 'mt-4 min-h-28' : 'mt-8 min-h-36'}`}>
        <span className={`flex items-center justify-center rounded-full border border-ember/30 bg-ember/10 text-ember-soft ${compact ? 'size-9' : 'size-11'}`}><Icon className={compact ? 'size-4' : 'size-5'} /></span>
        <h2 className={`font-display text-ivory ${compact ? 'mt-3 text-2xl' : 'mt-5 text-3xl'}`}>{stage.title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone">{stage.detail}</p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Session stages">
        {stages.map((item, index) => <button key={item.title} type="button" onClick={() => setActive(index)} aria-label={`Show stage ${index + 1}: ${item.title}`} aria-pressed={active === index} className={`ecla-control h-1.5 rounded-full ${active === index ? 'bg-ember' : 'bg-line-strong hover:bg-stone'}`} />)}
      </div>
    </div>
  )
}
