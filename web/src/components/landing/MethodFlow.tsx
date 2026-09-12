'use client'

import { useEffect, useState } from 'react'
import {
  Eye,
  Grid,
  MessageCircle,
  RefreshCw,
  Repeat,
  Target,
  Users,
  Zap,
  CheckCircle,
} from 'lucide-react'

const stages = [
  { label: 'Encounter', detail: 'Meet language in context.', Icon: Eye },
  { label: 'Understand', detail: 'Grasp meaning and structure.', Icon: Grid },
  { label: 'Notice', detail: 'See patterns and connections.', Icon: Target },
  { label: 'Recognize', detail: 'Identify familiar language.', Icon: CheckCircle },
  { label: 'Retrieve', detail: 'Bring it back from memory.', Icon: RefreshCw },
  { label: 'Produce', detail: 'Say and write with support.', Icon: Zap },
  { label: 'Interact', detail: 'Use it with another person.', Icon: Users },
  { label: 'Transfer', detail: 'Apply it to a new situation.', Icon: Repeat },
  { label: 'Retain', detail: 'Keep it available over time.', Icon: MessageCircle },
]

export default function MethodFlow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive(value => (value + 1) % stages.length), 2400)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <ol className="grid gap-px overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3 lg:grid-cols-9">
      {stages.map(({ label, detail, Icon }, index) => (
        <li key={label} onMouseEnter={() => setActive(index)} className={`min-w-0 bg-ink px-4 py-5 transition-colors duration-500 sm:px-5 lg:px-3 lg:py-6 ${active === index ? 'bg-ember/[.08]' : ''}`}>
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="flex items-center gap-3 lg:block">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black transition-colors duration-500 lg:mb-4 lg:h-7 lg:w-7 ${active === index ? 'bg-ember text-obsidian' : 'bg-white/[.07] text-stone'}`}>
                {index + 1}
              </span>
              <Icon aria-hidden="true" className="hidden h-4 w-4 text-ember-soft/75 sm:block lg:hidden" />
              <p className="text-sm font-extrabold text-ivory lg:text-xs">{label}</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-ivory/[42%] lg:text-[11px] lg:leading-4">{detail}</p>
        </li>
      ))}
    </ol>
  )
}
