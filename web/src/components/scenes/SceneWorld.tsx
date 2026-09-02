import { MapPin, Volume2 } from 'lucide-react'
import { sceneMood, speakerIdentity } from '@/lib/scenePresentation'

const moodClass = {
    cafe: 'from-amber-500/25 via-orange-950/30 to-night-900',
    street: 'from-sky-500/20 via-indigo-950/30 to-night-900',
    classroom: 'from-violet-500/20 via-purple-950/30 to-night-900',
    service: 'from-blue-500/20 via-slate-900/40 to-night-900',
    home: 'from-emerald-500/15 via-teal-950/25 to-night-900',
}

export function SceneWorld({ setting, speaker, title }: { setting: string; speaker?: string | null; title: string }) {
    const mood = sceneMood(setting)
    const person = speakerIdentity(speaker)
    return <div className={`relative min-h-48 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${moodClass[mood]} p-5 shadow-2xl sm:min-h-56 sm:p-7`}>
        <div aria-hidden className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-glow/10 blur-3xl" />
        <div aria-hidden className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-black/30 to-transparent" />
        <div className="relative flex h-full min-h-40 items-end justify-between gap-5">
            <div className="max-w-sm pb-1"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cream/55"><MapPin className="h-3.5 w-3.5" />{setting}</p><h1 className="font-display mt-2 text-2xl font-bold leading-tight text-cream sm:text-3xl">{title}</h1><p className="mt-3 flex items-center gap-2 text-xs text-cream/45"><Volume2 className="h-3.5 w-3.5" />Audio source is identified on every spoken line.</p></div>
            <div className="shrink-0 text-center"><div className="scene-character mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-glow/40 bg-night-900/80 text-3xl font-bold text-glow shadow-[0_0_32px_rgba(255,200,87,.18)] sm:h-28 sm:w-28 sm:text-4xl" aria-hidden>{person.initial}</div><p className="mt-2 max-w-28 truncate text-xs font-semibold text-cream/70">{person.name}</p></div>
        </div>
    </div>
}
