import {
  BookOpen,
  Headphones,
  MessageCircle,
  Mic,
  RefreshCw,
} from 'lucide-react'

const dimensions = [
  { name: 'Understanding', level: 88, Icon: Headphones },
  { name: 'Retrieval', level: 74, Icon: RefreshCw },
  { name: 'Production', level: 66, Icon: Mic },
  { name: 'Interaction', level: 58, Icon: MessageCircle },
  { name: 'Retention', level: 79, Icon: BookOpen },
]

export default function ProgressPreview() {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.12fr_0.88fr]">
      <section className="rounded-[24px] border border-white/[0.08] bg-[#0A121C] p-5 sm:p-7">
        <div className="flex flex-col gap-1 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-cream">Ability profile</p>
            <p className="mt-1 text-xs text-cream/[38%]">A product preview of how growth can be represented.</p>
          </div>
          <span className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-glow sm:mt-0">Evidence over activity</span>
        </div>

        <div className="mt-6 space-y-5">
          {dimensions.map(({ name, level, Icon }) => (
            <div key={name} className="grid grid-cols-[118px_1fr] items-center gap-4 sm:grid-cols-[150px_1fr]">
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-cream/[45%]" />
                <span className="truncate text-xs font-bold text-cream/[58%]">{name}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.055]">
                <div className="h-full rounded-full bg-glow" style={{ width: `${level}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/[0.08] bg-[#0A121C] p-5 sm:p-7">
        <div className="border-b border-white/[0.07] pb-5">
          <p className="text-sm font-extrabold text-cream">What progress means</p>
          <p className="mt-1 text-xs text-cream/[38%]">Not merely lessons completed.</p>
        </div>

        <div className="relative mx-auto mt-8 aspect-square max-w-[310px]">
          <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-glow/[35%] bg-glow/[0.05] text-center">
            <div>
              <span className="block font-editorial text-2xl font-semibold text-cream">Real ability</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-glow">the outcome</span>
            </div>
          </div>

          <div className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full border border-white/[0.09] bg-[#0D1722] px-3 py-2 text-[11px] font-bold text-cream/60">Understand</div>
          <div className="absolute right-0 top-[30%] rounded-full border border-white/[0.09] bg-[#0D1722] px-3 py-2 text-[11px] font-bold text-cream/60">Retrieve</div>
          <div className="absolute bottom-4 right-[9%] rounded-full border border-white/[0.09] bg-[#0D1722] px-3 py-2 text-[11px] font-bold text-cream/60">Produce</div>
          <div className="absolute bottom-4 left-[9%] rounded-full border border-white/[0.09] bg-[#0D1722] px-3 py-2 text-[11px] font-bold text-cream/60">Retain</div>
          <div className="absolute left-0 top-[30%] rounded-full border border-white/[0.09] bg-[#0D1722] px-3 py-2 text-[11px] font-bold text-cream/60">Interact</div>

          <svg className="absolute inset-0 h-full w-full text-white/[0.08]" viewBox="0 0 320 320" aria-hidden="true">
            <line x1="160" y1="160" x2="160" y2="30" stroke="currentColor" />
            <line x1="160" y1="160" x2="287" y2="115" stroke="currentColor" />
            <line x1="160" y1="160" x2="245" y2="280" stroke="currentColor" />
            <line x1="160" y1="160" x2="75" y2="280" stroke="currentColor" />
            <line x1="160" y1="160" x2="33" y2="115" stroke="currentColor" />
          </svg>
        </div>
      </section>
    </div>
  )
}
