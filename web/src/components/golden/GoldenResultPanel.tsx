import type { GoldenResult } from '../../../../packages/contracts/golden'

export function GoldenResultPanel({ result }: { result: GoldenResult }) {
    return <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6" aria-labelledby="golden-result-heading">
        <h2 id="golden-result-heading" className="text-2xl font-bold">{result.passed ? 'Greeting tasks completed independently' : 'More practice will help'}</h2>
        <p>{result.correct} of {result.total} responses matched the task meaning. {result.xpAwarded} XP awarded for this attempt.</p>
        <p className="text-sm text-cream/70">{result.explanation}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(result.dimensions).map(([name, value]) => <div key={name}>
                <dt className="capitalize text-cream/60">{name}</dt><dd>{value === null ? 'Not assessed' : `${Math.round(value)}% (pilot estimate)`}</dd>
            </div>)}
        </dl>
        <p className="text-sm">Provisional text-task stage: {result.provisionalLevel.toLowerCase()}. Recorded mastery: {result.masteryLevel.toLowerCase()}.</p>
        {!result.promotionEligible && <p className="text-sm text-amber-200">Educator review is pending. This is not a fluency certification.</p>}
        {result.nextReviewAt && <p className="text-sm text-cream/70">Next delayed-review time: {new Date(result.nextReviewAt).toLocaleString()}. A successful new-context transfer is also required.</p>}
    </section>
}
