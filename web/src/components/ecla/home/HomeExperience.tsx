'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRight, BookOpen, Check, MessageCircle, Repeat2, ShieldCheck } from 'lucide-react'
import type { LearnerHome } from '@/lib/summary'
import type { CourseCompetency } from '@/components/ecla/course/StageCard'
import { homeAtmosphereFor } from '@/lib/homeAtmosphere'

function progressPercent(done: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
}

function allCompetencies(home: LearnerHome): CourseCompetency[] {
  return home.courses.flatMap(course => course.units.flatMap(unit => unit.competencies ?? []))
}

function firstReviewHref(home: LearnerHome) {
  const due = home.summary.dueReviews[0]
  if (due) return `/learn/${encodeURIComponent(due.id || due.code)}?review=1`
  const retained = home.retentionReviews[0]
  return retained ? `/learn/${encodeURIComponent(retained.code)}?review=1` : '/review'
}

const MODES = [
  { label: 'Story', description: 'Use language in context.', icon: BookOpen, href: 'next' },
  { label: 'Practice', description: 'Strengthen what is fading.', icon: Repeat2, href: '/review' },
  { label: 'Mission', description: 'Prove it in a new situation.', icon: ShieldCheck, href: '/gateway' },
  { label: 'Conversation', description: 'Talk with Ecla.', icon: MessageCircle, href: '/chat' },
] as const

function nextReason(kind?: string, fallback?: string) {
  if (kind === 'review') return 'A quick return now will help this stay ready when you need it.'
  if (kind === 'gateway') return 'You are ready to use this ability in a fresh situation.'
  return fallback || 'Continue with the next scene in your journey.'
}

export default function HomeExperience({ home, fallbackName }: { home: LearnerHome; fallbackName?: string | null }) {
  const { summary } = home
  const course = home.courses[0]
  const competencies = allCompetencies(home)
  const mastered = competencies.filter(item => item.status === 'mastered' && item.canDo)
  const next = summary.nextAction
  const nextHref = next?.href || (next?.competencyId ? `/learn/${next.competencyId}` : '/course')
  const pct = progressPercent(summary.demonstrated, summary.total)
  const reviewCount = summary.dueReviews.length + home.retentionReviews.length
  const name = summary.name || fallbackName || 'there'
  const atmosphere = homeAtmosphereFor(new Date())

  return (
    <div className="space-y-9 pb-2 sm:space-y-12">
      <section className="ecla-reveal relative isolate min-h-[430px] overflow-hidden rounded-[22px] border border-line bg-ink shadow-[0_24px_70px_rgba(0,0,0,.35)] sm:min-h-[480px] sm:rounded-experience lg:min-h-[510px]">
        <Image src={atmosphere.src} alt="" fill priority sizes="(max-width: 768px) 100vw, 1200px" className="object-cover object-[66%_center]" />
        <div className="absolute inset-0" style={{ background: atmosphere.overlay }} />
        <div className="absolute inset-0 bg-obsidian/10 sm:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-px ecla-thread opacity-80" />

        <div className="relative flex min-h-[430px] flex-col p-4 sm:min-h-[480px] sm:p-7 lg:min-h-[510px] lg:p-9">
          <div className="ecla-dark-scene ecla-image-copy max-w-xl animate-fade-up">
            <p className="text-xs font-medium tracking-[0.16em] text-ember-soft">{atmosphere.greeting}, {name}.</p>
            <h1 className="mt-3 font-display text-[clamp(2.35rem,6vw,4.75rem)] leading-[.94] tracking-[-.035em] text-ivory">
              {course?.title ? <>{course.title}<br /><span className="text-stone">is waiting.</span></> : <>Your language<br /><span className="text-stone">is waiting.</span></>}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-stone sm:text-base">
              {nextReason(next?.kind, next?.reason)}
            </p>
          </div>

          <div className="mt-auto grid items-end gap-4 pt-10 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="ecla-theme-panel ecla-surface max-w-3xl rounded-surface p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ember-soft">
                {next?.kind === 'review' ? 'Ready to strengthen' : next?.kind === 'gateway' ? 'Ready to prove' : 'Continue your journey'}
              </p>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-tight text-ivory sm:text-3xl">{next?.title || 'Choose your next scene'}</h2>
                  {next?.canDo ? <p className="mt-1 max-w-xl text-sm leading-5 text-stone">{next.canDo}</p> : null}
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-[.16em] text-ash">
                    {[course?.level, next?.mode].filter(Boolean).join('   ') || 'Your next learning moment'}
                  </p>
                </div>
                <Link href={nextHref} className="ecla-control inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft">
                  Continue <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>

            <Link href="/progress" aria-label={`View progress: ${summary.demonstrated} of ${summary.total} capabilities demonstrated`}
              className="ecla-theme-panel ecla-surface ecla-control relative hidden size-32 shrink-0 place-content-center overflow-hidden rounded-full text-center hover:border-line-strong lg:grid">
              <svg aria-hidden className="absolute inset-2 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="var(--ecla-line-strong)" strokeWidth="3" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="var(--ecla-ember)" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct} 100`} />
              </svg>
              <span className="relative font-display text-3xl text-ivory">{pct}%</span>
              <span className="relative mt-1 block text-[9px] uppercase tracking-[.16em] text-stone">{summary.demonstrated}/{summary.total} demonstrated</span>
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="capabilities-heading" className="ecla-reveal grid gap-7 lg:grid-cols-[1.3fr_.7fr] lg:gap-12" style={{ '--ecla-delay': '70ms' } as CSSProperties}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ember-soft">Your language is changing</p>
          <h2 id="capabilities-heading" className="mt-3 font-display text-3xl text-ivory sm:text-4xl">What you can do now</h2>
          {mastered.length ? (
            <ul className="mt-7 divide-y divide-line border-y border-line">
              {mastered.slice(-3).reverse().map(item => (
                <li key={item.id} className="flex gap-4 py-4">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/10 text-success"><Check className="size-3.5" /></span>
                  <div><p className="text-sm leading-6 text-ivory">{item.canDo}</p><p className="mt-1 text-[10px] uppercase tracking-[.15em] text-ash">{item.code}</p></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-7 border-y border-line py-6"><p className="max-w-lg text-sm leading-6 text-stone">Your first demonstrated capability will appear here after Ecla records enough evidence.</p></div>
          )}
        </div>

        <div className="border-l-0 border-line lg:border-l lg:pl-10">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ash">Next capability</p>
          <p className="mt-3 font-display text-2xl leading-tight text-ivory">{next?.canDo || next?.title || 'Continue the journey'}</p>
          <Link href="/course" className="ecla-control mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ember-soft hover:text-ivory">View your journey <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      {reviewCount > 0 ? (
        <section className="ecla-reveal relative overflow-hidden rounded-surface border border-ember/20 bg-carbon p-4 sm:p-6" style={{ '--ecla-delay': '120ms' } as CSSProperties}>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ember-soft">A memory is ready</p><h2 className="mt-2 font-display text-2xl text-ivory sm:text-3xl">{reviewCount === 1 ? 'One capability needs a return.' : `${reviewCount} capabilities are ready to return.`}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-stone">A short encounter now helps the language stay available when you need it.</p></div>
            <Link href={firstReviewHref(home)} className="ecla-control inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-semibold text-ivory hover:bg-surface-raised">Practice now <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      ) : (
        <section className="border-y border-line py-6"><p className="text-sm text-stone">Nothing needs review yet. Keep learning; Ecla will bring language back when your memory needs the challenge.</p></section>
      )}

      <section aria-labelledby="modes-heading" className="ecla-reveal" style={{ '--ecla-delay': '170ms' } as CSSProperties}>
        <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ash">Choose the kind of moment</p><h2 id="modes-heading" className="mt-2 font-display text-3xl text-ivory">Ways to learn</h2></div><Link href="/course" className="hidden text-xs text-ember-soft hover:text-ivory sm:block">Explore the journey</Link></div>
        <div className="mt-5 grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {MODES.map(({ label, description, icon: Icon, href }, index) => (
            <Link key={label} href={href === 'next' ? nextHref : href} className={`ecla-control ecla-lift group flex min-h-28 flex-col justify-between p-4 hover:bg-white/[.035] sm:min-h-32 sm:p-5 ${index % 2 ? 'border-l border-line' : ''} ${index > 1 ? 'border-t border-line lg:border-t-0' : ''} ${index > 0 && index < 2 ? 'lg:border-l' : ''}`}>
              <Icon className="size-5 text-ember-soft" strokeWidth={1.5} /><div><h3 className="font-display text-lg text-ivory sm:text-xl">{label}</h3><p className="mt-1 text-xs leading-4 text-ash sm:leading-5">{description}</p></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
