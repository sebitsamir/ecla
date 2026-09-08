import Image from 'next/image'
import { MapPin, Volume2 } from 'lucide-react'
import { sceneBackground, sceneMood, speakerIdentity } from '@/lib/scenePresentation'

export function SceneWorld({ setting, speaker, title }: { setting: string; speaker?: string | null; title: string }) {
    const mood = sceneMood(setting)
    const person = speakerIdentity(speaker)
    return <div className="relative min-h-[23rem] overflow-hidden bg-obsidian sm:min-h-[30rem] lg:min-h-[36rem]">
        <Image src={sceneBackground[mood]} alt="" fill priority sizes="100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,10,.12)_0%,rgba(9,9,10,.22)_38%,rgba(9,9,10,.92)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,transparent_0%,rgba(9,9,10,.28)_68%,rgba(9,9,10,.58)_100%)]" />
        <div className="relative flex min-h-[23rem] flex-col justify-between p-5 sm:min-h-[30rem] sm:p-8 lg:min-h-[36rem]">
            <div className="flex items-start justify-between gap-4">
                <p className="inline-flex max-w-[75%] items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[.16em] text-ivory/80 backdrop-blur-md"><MapPin className="size-3.5 shrink-0 text-ember-soft" /><span className="truncate">{setting}</span></p>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[11px] text-ivory/65 backdrop-blur-md"><Volume2 className="size-3.5" />Spanish</p>
            </div>
            <div className="flex items-end justify-between gap-5">
                <div className="max-w-xl"><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">In this scene</p><h1 className="font-display text-3xl leading-[1.05] text-ivory drop-shadow-lg sm:text-5xl">{title}</h1></div>
                <div className="shrink-0 text-center"><div className="scene-character mx-auto flex size-16 items-center justify-center rounded-full border border-ember-soft/50 bg-obsidian/75 text-2xl font-medium text-ember-soft shadow-[0_0_36px_rgba(255,122,61,.2)] backdrop-blur-md sm:size-20 sm:text-3xl" aria-hidden>{person.initial}</div><p className="mt-2 max-w-28 truncate text-xs font-semibold text-ivory/80">{person.name}</p></div>
            </div>
        </div>
    </div>
}
