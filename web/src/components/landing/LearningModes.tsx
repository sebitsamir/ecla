'use client'

import Image from 'next/image'
import { BookOpen, Briefcase, Headphones, Map, Target } from 'lucide-react'
import { StackedCardCarousel } from '@/components/ui'

const modes = [
  { name: 'Story', description: 'Build understanding through connected narratives and real-life situations.', image: '/worlds/journey/unit-first-contact.webp', alt: 'A learner greeting a café barista at the start of a connected story', Icon: BookOpen },
  { name: 'Drill', description: 'Strengthen retrieval with focused practice that responds to what needs work.', image: '/worlds/journey/unit-sound-orientation.webp', alt: 'A tutor guiding focused practice with Spanish letters and sounds', Icon: Headphones },
  { name: 'Immersion', description: 'Operate inside realistic contexts where meaning matters more than translation.', image: '/worlds/journey/unit-mini-real-life.webp', alt: 'A learner navigating conversation, shopping, and directions in a neighborhood', Icon: Map },
  { name: 'Professional', description: 'Practice language for work, study, formal situations, and professional communication.', image: '/worlds/journey/unit-interaction-repair.webp', alt: 'Two people clarifying meaning through careful, purposeful communication', Icon: Briefcase },
  { name: 'Mission', description: 'Combine skills in guided challenges that test whether you can actually use them.', image: '/worlds/journey/unit-everyday-survival.webp', alt: 'A learner completing a real-world navigation challenge at a transit stop', Icon: Target },
]

export default function LearningModes() {
  return <StackedCardCarousel items={modes} getKey={item => item.name} getLabel={item => item.name} label="Ways to learn" desktopColumnsClassName="sm:grid-cols-2 lg:grid-cols-5" mobileHeight="27rem" cardHeight="26rem" renderCard={({ name, description, image, alt, Icon }) => <div className="group flex h-full flex-col">
    <div className="ecla-dark-scene relative aspect-[4/3] shrink-0 overflow-hidden border-b border-line bg-ink sm:aspect-[16/10]">
      <Image src={image} alt={alt} fill sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) 50vw, 20vw" className="object-cover transition duration-700 group-hover:scale-[1.045] motion-reduce:transform-none motion-reduce:transition-none" />
      <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
      <span className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-ember-soft backdrop-blur-md"><Icon className="size-4" /></span>
    </div>
    <div className="flex-1 p-5"><h3 className="font-display text-2xl leading-none text-ivory">{name}</h3><p className="mt-3 text-sm leading-6 text-stone">{description}</p></div>
  </div>} />
}
