'use client'

import { useRef, type PointerEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, CheckCircle } from 'lucide-react'
import LandingAuthActions from './LandingAuthActions'
import JourneyPreview from './JourneyPreview'

const trust = ['A guided curriculum', 'Practice that adapts', 'Progress you can explain']

export default function LandingHero() {
  const heroRef = useRef<HTMLElement>(null)

  const move = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    event.currentTarget.style.setProperty('--ecla-pointer-x', x.toFixed(3))
    event.currentTarget.style.setProperty('--ecla-pointer-y', y.toFixed(3))
    event.currentTarget.style.setProperty('--ecla-pointer-left', `${event.clientX - bounds.left}px`)
    event.currentTarget.style.setProperty('--ecla-pointer-top', `${event.clientY - bounds.top}px`)
  }

  const reset = () => {
    heroRef.current?.style.setProperty('--ecla-pointer-x', '0')
    heroRef.current?.style.setProperty('--ecla-pointer-y', '0')
  }

  return (
    <section ref={heroRef} onPointerMove={move} onPointerLeave={reset} className="ecla-spatial-hero relative isolate min-h-[calc(100svh-4rem)] overflow-hidden border-b border-line">
      <div className="ecla-hero-media absolute -inset-5 -z-30">
        <Image src="/worlds/spanish-evening-v2.webp" alt="A learner overlooking a Spanish city at sunset" fill priority sizes="100vw" className="object-cover object-[62%_center]" />
      </div>
      <div aria-hidden className="ecla-image-shade absolute inset-0 -z-20" />
      <div aria-hidden className="ecla-pointer-light absolute -z-10 hidden size-72 rounded-full bg-ember/20 blur-3xl lg:block" />
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[1200px] gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,.88fr)] lg:items-center lg:px-8">
        <div className="ecla-dark-scene ecla-image-copy ecla-hero-copy ecla-reveal max-w-[620px]">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-soft">Speak · understand · use</p>
          <h1 className="font-display text-[clamp(3rem,7vw,5.8rem)] font-normal leading-[0.91] tracking-[-0.045em] text-ivory">Learn until you can <span className="text-ember-soft">use it.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ivory/80 sm:text-lg">Build Spanish through real scenes, timely practice, and a clear path that remembers where you are.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><LandingAuthActions primaryOnly /><Link href="#method" className="ecla-control inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/25 bg-black/25 px-5 text-sm font-semibold text-ivory hover:border-white/45">Explore the journey <ArrowRight className="size-4" /></Link></div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">{trust.map(item => <span key={item} className="inline-flex items-center gap-2 text-xs text-ivory/70"><CheckCircle className="size-3.5 text-ember-soft" />{item}</span>)}</div>
          <div className="mt-8 sm:max-w-lg lg:hidden"><JourneyPreview compact /></div>
        </div>
        <div className="ecla-hero-card hidden lg:block"><JourneyPreview /></div>
      </div>
      <a href="#method" aria-label="Continue to how Ecla works" className="ecla-control absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-ivory/65 hover:text-ivory sm:flex">
        <span>Discover</span><ArrowDown className="ecla-scroll-cue size-4 text-ember-soft" />
      </a>
    </section>
  )
}
