import Link from 'next/link'
import { Cormorant_Garamond } from 'next/font/google'
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  CheckCircle,
  Compass,
  Layers,
  MessageCircle,
  RefreshCw,
  Shield,
  Target,
  Users,
} from 'lucide-react'
import LandingAuthActions from './LandingAuthActions'
import LandingFooter from './LandingFooter'
import LandingHeader from './LandingHeader'
import LearningModes from './LearningModes'
import MethodFlow from './MethodFlow'
import ProductPreview from './ProductPreview'
import ProgressPreview from './ProgressPreview'
import SectionHeading from './SectionHeading'

const editorial = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-editorial',
  display: 'swap',
})

const abilities = [
  {
    title: 'Curriculum-first',
    copy: 'A structured learning path connects concepts, situations, practice, and evidence instead of presenting isolated activities.',
    Icon: BookOpen,
  },
  {
    title: 'Adaptive mastery',
    copy: 'Practice responds to what is becoming reliable, what is fading, and what still needs support.',
    Icon: BarChart2,
  },
  {
    title: 'Real situations',
    copy: 'Language is learned inside meaningful contexts so knowledge can transfer beyond the lesson itself.',
    Icon: Users,
  },
  {
    title: 'Meaningful review',
    copy: 'Review is timed around memory and evidence, helping useful language stay available over the long term.',
    Icon: RefreshCw,
  },
]

const system = [
  { title: 'Gateway', copy: 'Find the right starting point.', Icon: Compass },
  { title: 'Course', copy: 'Follow a coherent curriculum.', Icon: Layers },
  { title: 'Learn', copy: 'Build ability through varied practice.', Icon: BookOpen },
  { title: 'Review', copy: 'Strengthen memory when it matters.', Icon: RefreshCw },
  { title: 'Progress', copy: 'See evidence of what is becoming reliable.', Icon: BarChart2 },
  { title: 'Conversation', copy: 'Use language inside real interaction.', Icon: MessageCircle },
]

const trust = [
  'Structured curriculum',
  'Adaptive practice',
  'Evidence-based progress',
]

export default function LandingPage() {
  return (
    <main className={`${editorial.variable} min-h-screen overflow-x-hidden bg-[#080A18] font-body text-cream selection:bg-glow/25 selection:text-cream`}>
      <style>{`.font-editorial{font-family:var(--font-editorial),Georgia,'Times New Roman',serif}`}</style>
      <LandingHeader />

      <section className="relative border-b border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-[1240px] gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="max-w-[610px]">
            <p className="mb-5 text-[11px] font-extrabold uppercase tracking-[0.3em] text-glow sm:text-xs">
              A more deliberate way to learn
            </p>
            <h1 className="font-display text-5xl font-normal leading-[0.98] tracking-[-0.035em] text-cream sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Language learning <br/> built for <span className="text-glow">real fluency.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-cream/60 sm:text-lg sm:leading-8">
              ECLA combines a structured curriculum, adaptive review, real-world practice, and measurable progress to help you understand, remember, and use a language with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LandingAuthActions primaryOnly />
              <Link
                href="#method"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.11] px-5 text-sm font-extrabold text-cream/[72%] transition hover:border-white/20 hover:bg-white/[0.025] hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow/70 sm:min-h-[44px]"
              >
                See the method
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {trust.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-xs font-bold text-cream/[38%]">
                  <CheckCircle aria-hidden="true" className="h-3.5 w-3.5 text-glow" />
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-5 text-xs leading-5 text-cream/30">
              Built to expand across languages without changing the core learning system.
            </p>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="method" className="scroll-mt-24 border-b border-white/[0.06] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="From first encounter to real use"
              title="A learning flow built to create usable ability."
            />
            <p className="max-w-md text-sm leading-7 text-cream/[44%] lg:text-right">
              Each stage has a job. Exposure becomes understanding, understanding becomes retrieval, and retrieval becomes confident use.
            </p>
          </div>
          <MethodFlow />
        </div>
      </section>

      <section className="border-b border-white/[0.06] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <SectionHeading
            title="Built to create ability, not just activity."
            description="ECLA is organized around durable learning outcomes. The interface stays restrained so the curriculum, practice, and progress remain the focus."
          />

          <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {abilities.map(({ title, copy, Icon }) => (
              <article key={title} className="bg-[#0A121C] p-6 sm:p-7">
                <Icon aria-hidden="true" className="h-5 w-5 text-glow" />
                <h3 className="mt-6 text-base font-extrabold text-cream">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-cream/[48%]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="curriculum" className="scroll-mt-24 border-b border-white/[0.06] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="One curriculum. Multiple ways to learn."
              title="Different experiences. One connected learning system."
            />
            <p className="max-w-md text-sm leading-7 text-cream/[44%] lg:text-right">
              Modes change how you practice without fragmenting your progress. What you learn remains connected to the same curriculum and mastery model.
            </p>
          </div>
          <LearningModes />
        </div>
      </section>

      <section id="system" className="scroll-mt-24 border-b border-white/[0.06] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="The ECLA system"
            title="A clear path from starting point to real communication."
            description="The product is designed as one connected journey rather than a collection of disconnected screens."
          />

          <ol className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-6">
            {system.map(({ title, copy, Icon }, index) => (
              <li key={title} className="relative bg-[#0A121C] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden="true" className="h-5 w-5 text-glow" />
                  <span className="text-[10px] font-black tracking-[0.18em] text-cream/20">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-sm font-extrabold text-cream">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-cream/[42%]">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="progress" className="scroll-mt-24 border-b border-white/[0.06] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Progress that means something"
              title="Track what is becoming usable, not only what is completed."
            />
            <p className="max-w-md text-sm leading-7 text-cream/[44%] lg:text-right">
              ECLA is built to reason about learning evidence across understanding, retrieval, production, interaction, and retention.
            </p>
          </div>
          <ProgressPreview />
        </div>
      </section>

      <section id="about" className="scroll-mt-24 border-b border-white/[0.06] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-20 lg:px-10">
          <SectionHeading
            eyebrow="Start with one. Grow across many."
            title="A language platform designed to expand without losing its learning philosophy."
            description="ECLA begins with one language, but the curriculum architecture, practice system, review model, and progress framework are built as reusable foundations for a broader language platform."
          />

          <div className="rounded-[24px] border border-white/[0.08] bg-[#0A121C] p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Target aria-hidden="true" className="h-5 w-5 text-glow" />
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-cream/[35%]">Current launch</p>
                <p className="mt-2 font-editorial text-3xl font-semibold tracking-[-0.03em] text-cream">Spanish first</p>
              </div>
              <div>
                <Shield aria-hidden="true" className="h-5 w-5 text-glow" />
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-cream/[35%]">Platform direction</p>
                <p className="mt-2 font-editorial text-3xl font-semibold tracking-[-0.03em] text-cream">Language-agnostic core</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[28px] border border-glow/20 bg-[#0A121C] px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-14">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glow/80 to-transparent" aria-hidden="true" />
            <div className="max-w-3xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-glow sm:text-xs">Begin with a better system</p>
              <h2 className="mt-4 font-editorial text-[2.7rem] font-semibold leading-[0.95] tracking-[-0.04em] text-cream sm:text-5xl lg:text-[3.6rem]">
                Build language ability that lasts beyond the lesson.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-cream/[48%] sm:text-base">
                Start the structured learning journey and let every session contribute to what you can actually do.
              </p>
            </div>
            <div className="mt-8 shrink-0 lg:mt-0">
              <LandingAuthActions primaryOnly />
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  )
}
