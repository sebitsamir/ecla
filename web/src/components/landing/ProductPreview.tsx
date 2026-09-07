import Image from 'next/image'
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  MessageCircle,
  Play,
  Volume2,
} from 'lucide-react'

const units = [
  'Everyday life',
  'People & relationships',
  'Places & movement',
  'Food & daily needs',
  'Work & practical tasks',
]

export default function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[610px] lg:mx-0 lg:max-w-none">
      <div className="absolute -inset-x-4 bottom-2 top-10 -z-10 rounded-[36px] bg-glow/[0.035] blur-3xl" aria-hidden="true" />

      <div className="grid gap-3 sm:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-[22px] border border-white/[0.09] bg-[#0B1420] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.22)] sm:p-5">
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div>
              <p className="font-editorial text-xl font-semibold tracking-[-0.02em] text-cream">Foundation course</p>
              <p className="mt-1 text-xs font-semibold text-cream/40">Structured progression</p>
            </div>
            <span className="rounded-full border border-glow/20 bg-glow/[0.06] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-glow">
              Active
            </span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-[38%] rounded-full bg-glow" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-cream/[35%]">
            <span>Current path</span>
            <span>Progressive</span>
          </div>

          <ol className="mt-5 space-y-1.5">
            {units.map((unit, index) => {
              const active = index === 0
              return (
                <li
                  key={unit}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold ${
                    active ? 'border border-glow/20 bg-glow/[0.07] text-cream' : 'text-cream/[48%]'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] ${
                      active ? 'bg-glow text-night-950' : 'bg-white/[0.05] text-cream/[45%]'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{unit}</span>
                  {active ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-glow" /> : null}
                </li>
              )
            })}
          </ol>
        </section>

        <div className="grid gap-3">
          <section className="overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0B1420] shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-cream/70">
                <BookOpen aria-hidden="true" className="h-4 w-4 text-glow" />
                Lesson
              </div>
              <span className="text-[11px] font-extrabold tracking-wide text-glow">In progress</span>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr] sm:p-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08]">
                <Image
                  src="/landing/hero.webp"
                  alt="A calm café environment used as contextual learning imagery"
                  fill
                  priority
                  sizes="(max-width: 639px) 100vw, 132px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" aria-hidden="true" />
              </div>

              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-base font-extrabold text-cream">Listen and respond</p>
                <p className="mt-1.5 text-xs leading-5 text-cream/50">
                  Build understanding, then use the language in context.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-glow text-night-950">
                    <Play className="ml-0.5 h-4 w-4" />
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.09] text-cream/[55%]">
                    <Volume2 aria-hidden="true" className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-[20px] border border-white/[0.09] bg-[#0B1420] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-cream/[65%]">Ability growth</p>
                <BarChart2 aria-hidden="true" className="h-4 w-4 text-glow" />
              </div>
              <div className="mt-5 flex h-20 items-end gap-1.5" aria-hidden="true">
                {[30, 42, 50, 58, 66, 76, 86].map((height) => (
                  <span key={height} className="flex-1 rounded-t-sm bg-glow/80" style={{ height: `${height}%` }} />
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-4 text-cream/[38%]">Measured by demonstrated ability.</p>
            </section>

            <section className="flex flex-col rounded-[20px] border border-white/[0.09] bg-[#0B1420] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-cream/[65%]">Conversation</p>
                <MessageCircle aria-hidden="true" className="h-4 w-4 text-glow" />
              </div>
              <p className="mt-5 text-sm font-bold leading-5 text-cream">Use what you know in a real situation.</p>
              <span className="mt-auto pt-4 text-[11px] font-bold text-cream/40">Context-first practice</span>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
