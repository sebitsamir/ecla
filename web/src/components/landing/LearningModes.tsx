import Image from 'next/image'
import {
  BookOpen,
  Briefcase,
  Headphones,
  Map,
  Target,
} from 'lucide-react'

const modes = [
  {
    name: 'Story',
    description: 'Build understanding through connected narratives and real-life situations.',
    image: '/worlds/journey/unit-first-contact.webp',
    alt: 'A learner greeting a café barista at the start of a connected story',
    Icon: BookOpen,
  },
  {
    name: 'Drill',
    description: 'Strengthen retrieval with focused practice that responds to what needs work.',
    image: '/worlds/journey/unit-sound-orientation.webp',
    alt: 'A tutor guiding focused practice with Spanish letters and sounds',
    Icon: Headphones,
  },
  {
    name: 'Immersion',
    description: 'Operate inside realistic contexts where meaning matters more than translation.',
    image: '/worlds/journey/unit-mini-real-life.webp',
    alt: 'A learner navigating conversation, shopping, and directions in a neighborhood',
    Icon: Map,
  },
  {
    name: 'Professional',
    description: 'Practice language for work, study, formal situations, and professional communication.',
    image: '/worlds/journey/unit-interaction-repair.webp',
    alt: 'Two people clarifying meaning through careful, purposeful communication',
    Icon: Briefcase,
  },
  {
    name: 'Mission',
    description: 'Combine skills in guided challenges that test whether you can actually use them.',
    image: '/worlds/journey/unit-everyday-survival.webp',
    alt: 'A learner completing a real-world navigation challenge at a transit stop',
    Icon: Target,
  },
]

export default function LearningModes() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {modes.map(({ name, description, image, alt, Icon }) => (
        <article
          key={name}
          className="group overflow-hidden rounded-[22px] border border-white/[0.08] bg-ink transition duration-300 hover:-translate-y-0.5 hover:border-ember/25 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.07] bg-white/[0.02]">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 20vw"
              className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-obsidian/28" aria-hidden="true" />
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Icon aria-hidden="true" className="h-4 w-4 text-ember-soft" />
                <h3 className="font-display text-[1.35rem] font-normal leading-none tracking-[-0.02em] text-ivory">{name}</h3>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-ivory/[48%]">{description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
