import type { GoldenResult } from '../../../../packages/contracts/golden'

export function GoldenResultPanel({ result }: { result: GoldenResult }) {
    return <section className="overflow-hidden rounded-experience border border-line bg-carbon shadow-glow-md" aria-labelledby="golden-result-heading">
        <div className="ecla-thread" /><div className="p-6 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">{result.passed ? 'Scene complete' : 'Keep building'}</p>
        <h2 id="golden-result-heading" className="font-display mt-3 text-3xl leading-tight sm:text-4xl">{result.passed ? 'You communicated the greeting.' : 'More practice will help.'}</h2>
        <p className="mt-4 text-stone">{result.correct} of {result.total} responses matched the task meaning. <span className="text-ivory">{result.xpAwarded} XP</span> awarded for this attempt.</p>
        <p className="mt-3 text-sm leading-relaxed text-stone">{result.explanation}</p>
        <dl className="mt-7 grid gap-3 sm:grid-cols-2">
            {Object.entries(result.dimensions).map(([name, value]) => <div className="rounded-control border border-line bg-obsidian/40 p-4" key={name}>
                <dt className="text-xs capitalize text-stone">{name}</dt><dd className="mt-1 font-display text-xl">{value === null ? 'Not assessed' : `${Math.round(value)}%`}<span className="ml-2 font-sans text-[10px] uppercase tracking-wide text-ash">{value === null ? '' : 'pilot estimate'}</span></dd>
            </div>)}
        </dl>
        <p className="mt-6 text-sm">Provisional text-task stage: {result.provisionalLevel.toLowerCase()}. Recorded mastery: {result.masteryLevel.toLowerCase()}.</p>
        {!result.promotionEligible && <p className="mt-3 rounded-control border border-warning/30 bg-warning/10 p-4 text-sm text-amber-200">Educator review is pending. This is not a fluency certification.</p>}
        {result.nextReviewAt && <p className="mt-3 text-sm text-stone">Next delayed-review time: {new Date(result.nextReviewAt).toLocaleString()}. A successful new-context transfer is also required.</p>}
        </div>
    </section>
}
