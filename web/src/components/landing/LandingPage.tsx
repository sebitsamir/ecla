import LandingAuthActions from './LandingAuthActions'
import LandingFooter from './LandingFooter'
import LandingHeader from './LandingHeader'
import LandingHero from './LandingHero'
import LearningModes from './LearningModes'
import MethodFlow from './MethodFlow'
import ProgressPreview from './ProgressPreview'
import SectionHeading from './SectionHeading'

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-obsidian font-body text-ivory">
      <LandingHeader />
      <LandingHero />
      <section id="method" className="ecla-scroll-reveal scroll-mt-20 border-b border-line py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="One connected journey" title="A clear path from first encounter to confident use." description="Each stage has a purpose: meet the language, understand it, retrieve it, and use it in a new situation." /><div className="mt-8"><MethodFlow /></div></div></section>
      <section id="learning" className="ecla-scroll-reveal scroll-mt-20 border-b border-line py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="Ways to learn" title="Different moments. The same progress." description="Move between guided scenes, focused practice, conversation, and real-world missions without losing your place." /><div className="mt-8"><LearningModes /></div></div></section>
      <section id="progress" className="ecla-scroll-reveal scroll-mt-20 border-b border-line py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="Progress with meaning" title="See what you can understand, remember, and use." description="Ecla shows the abilities supported by your assessed work, so progress stays honest and useful." /><div className="mt-8"><ProgressPreview /></div></div></section>
      <section className="py-14 sm:py-18 lg:py-20"><div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"><div className="rounded-experience border border-ember/25 bg-ink px-5 py-8 sm:flex sm:items-center sm:justify-between sm:gap-10 sm:px-8 sm:py-10"><div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-ember-soft">Begin your journey</p><h2 className="font-display mt-3 text-3xl leading-tight text-ivory sm:text-4xl">Build language that stays with you.</h2><p className="mt-3 text-sm leading-6 text-stone">Start with the right scene and let each session move the same journey forward.</p></div><div className="mt-6 shrink-0 sm:mt-0"><LandingAuthActions primaryOnly /></div></div></div></section>
      <LandingFooter />
    </main>
  )
}
