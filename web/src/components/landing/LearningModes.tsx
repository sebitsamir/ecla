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
    image: '/landing/mode-story.webp',
    alt: 'Warm European street used as a narrative learning setting',
    Icon: BookOpen,
  },
  {
    name: 'Drill',
    description: 'Strengthen retrieval with focused practice that responds to what needs work.',
    image: '/landing/mode-drill.webp',
    alt: 'Premium headphones representing focused listening and practice',
    Icon: Headphones,
  },
  {
    name: 'Immersion',
    description: 'Operate inside realistic contexts where meaning matters more than translation.',
    image: '/landing/mode-immersion.webp',
    alt: 'Street scene representing contextual and immersive learning',
    Icon: Map,
  },
  {
    name: 'Professional',
    description: 'Practice language for work, study, formal situations, and professional communication.',
    image: '/landing/mode-professional.webp',
    alt: 'Minimal professional workspace representing career-focused learning',
    Icon: Briefcase,
  },
  {
    name: 'Mission',
    description: 'Combine skills in guided challenges that test whether you can actually use them.',
    image: '/landing/mode-mission.webp',
    alt: 'Mountain landscape representing guided challenge and progression',
    Icon: Target,
  },
]

export default function LearningModes() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {modes.map(({ name, description, image, alt, Icon }) => (
        <article
          key={name}
          className="group overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0A121C] transition duration-300 hover:-translate-y-0.5 hover:border-glow/25 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.07] bg-white/[0.02]">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 20vw"
              className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A121C]/50 via-transparent to-transparent" aria-hidden="true" />
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Icon aria-hidden="true" className="h-4 w-4 text-glow" />
                <h3 className="font-editorial text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-cream">{name}</h3>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-cream/[48%]">{description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
