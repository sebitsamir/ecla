'use client'

/**
 * WeekEvidence — honest weekly evidence (demonstrated / conversations /
 * repairs), never an invented "+12%" metric.
 */
import type { WeekStats } from '@/lib/summary'

export default function WeekEvidence({ week }: { week: WeekStats }) {
    const quiet = week.demonstrated + week.conversations + week.repairs === 0
    return (
        <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-cream/50">This week</p>
            {quiet ? (
                <p className="text-sm text-cream/60">A quiet week so far — one short encounter changes that.</p>
            ) : (
                <ul className="space-y-2 text-sm text-cream/80">
                    {week.demonstrated > 0 && <li>+{week.demonstrated} competencies demonstrated</li>}
                    {week.conversations > 0 && <li>{week.conversations} mission conversation{week.conversations === 1 ? '' : 's'}</li>}
                    {week.repairs > 0 && <li>{week.repairs} misunderstanding{week.repairs === 1 ? '' : 's'} repaired</li>}
                </ul>
            )}
        </div>
    )
}