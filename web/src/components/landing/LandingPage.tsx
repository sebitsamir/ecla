import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import LandingAuthActions from './LandingAuthActions'
import LandingFooter from './LandingFooter'
import LandingHeader from './LandingHeader'
import LearningModes from './LearningModes'
import MethodFlow from './MethodFlow'
import ProgressPreview from './ProgressPreview'
import SectionHeading from './SectionHeading'

const trust = ['A guided curriculum', 'Practice that adapts', 'Progress you can explain']

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-obsidian font-body text-ivory">
      <LandingHeader />
      <section className="ecla-dark-scene relative isolate overflow-hidden border-b border-line">
        <Image src="/worlds/spanish-evening-v2.webp" alt="A learner overlooking a Spanish city at sunset" fill priority sizes="100vw" className="-z-30 object-cover object-[62%_center]" />
        <div aria-hidden className="absolute inset-0 -z-20 bg-obsidian/55" />
        <div className="mx-auto grid min-h-[34rem] w-full max-w-[1200px] gap-8 px-4 py-12 sm:min-h-[38rem] sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,.9fr)] lg:items-center lg:px-8">
          <div className="ecla-reveal max-w-[620px]">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-soft">Speak · understand · use</p>
            <h1 className="font-display text-[clamp(2.7rem,7vw,5rem)] font-normal leading-[0.95] tracking-[-0.04em] text-ivory">Learn until you can <span className="text-ember-soft">use it.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ivory/80 sm:text-lg">Build Spanish through real scenes, timely practice, and a clear path that remembers where you are.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"><LandingAuthActions primaryOnly /><Link href="#method" className="ecla-control inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/25 bg-black/25 px-5 text-sm font-semibold text-ivory hover:border-white/45">See how Ecla works <ArrowRight className="size-4" /></Link></div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">{trust.map(item => <span key={item} className="inline-flex items-center gap-2 text-xs text-ivory/70"><CheckCircle className="size-3.5 text-ember-soft" />{item}</span>)}</div>
          </div>
          <div className="hidden lg:block"><div className="rounded-experience border border-white/15 bg-ink/90 p-6 shadow-glow-md backdrop-blur-xl"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-ember-soft">Your next scene</p><h2 className="font-display mt-3 text-3xl text-ivory">Listen and respond</h2><p className="mt-3 text-sm leading-6 text-stone">Meet the language in context, respond in your own words, and keep the evidence that matters.</p><div className="mt-6 h-px bg-line" /><p className="mt-5 text-xs text-stone">One account. One journey. Every learning mode connected.</p></div></div>
        </div>
      </section>
      <section id="method" className="scroll-mt-20 border-b border-line py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="One connected journey" title="A clear path from first encounter to confident use." description="Each stage has a purpose: meet the language, understand it, retrieve it, and use it in a new situation." /><div className="mt-8"><MethodFlow /></div></div></section>
      <section id="learning" className="scroll-mt-20 border-b border-line py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="Ways to learn" title="Different moments. The same progress." description="Move between guided scenes, focused practice, conversation, and real-world missions without losing your place." /><div className="mt-8"><LearningModes /></div></div></section>
      <section id="progress" className="scroll-mt-20 border-b border-line py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="Progress with meaning" title="See what you can understand, remember, and use." description="Ecla shows the abilities supported by your assessed work, so progress stays honest and useful." /><div className="mt-8"><ProgressPreview /></div></div></section>
      <section className="py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><div className="rounded-experience border border-ember/25 bg-ink px-5 py-8 sm:flex sm:items-center sm:justify-between sm:gap-10 sm:px-8 sm:py-10"><div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-ember-soft">Begin your journey</p><h2 className="font-display mt-3 text-3xl leading-tight text-ivory sm:text-4xl">Build language that stays with you.</h2><p className="mt-3 text-sm leading-6 text-stone">Start with the right scene and let each session move the same journey forward.</p></div><div className="mt-6 shrink-0 sm:mt-0"><LandingAuthActions primaryOnly /></div></div></div></section>
      <LandingFooter />
    </main>
  )
}
