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
  return (
    <ol className="grid gap-px overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3 lg:grid-cols-9">
      {stages.map(({ label, detail, Icon }, index) => (
        <li key={label} className="min-w-0 bg-[#0A121C] px-4 py-5 sm:px-5 lg:px-3 lg:py-6">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="flex items-center gap-3 lg:block">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-glow text-[11px] font-black text-night-950 lg:mb-4 lg:h-7 lg:w-7">
                {index + 1}
              </span>
              <Icon aria-hidden="true" className="hidden h-4 w-4 text-glow/75 sm:block lg:hidden" />
              <p className="text-sm font-extrabold text-cream lg:text-xs">{label}</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-cream/[42%] lg:text-[11px] lg:leading-4">{detail}</p>
        </li>
      ))}
    </ol>
  )
}
