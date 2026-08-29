'use client'

/**
 * CompetencyGraph — Phase 25: simple prerequisite visualization.
 * Nodes = competencies; edges = prerequisite links within a unit.
 */
import Link from 'next/link'

export type GraphNode = {
    id: string
    code: string
    title: string
    status: string
    href: string
    prerequisites: string[]
}

const STATUS_COLOR: Record<string, string> = {
    mastered: 'border-leaf/50 bg-leaf/10 text-leaf',
    developing: 'border-glow/40 bg-glow/10 text-glow',
    upcoming: 'border-white/20 bg-white/5 text-cream/80',
    locked: 'border-white/10 bg-white/[0.02] text-cream/40',
}

export default function CompetencyGraph({ nodes }: { nodes: GraphNode[] }) {
    if (!nodes.length) return null

    const byCode = new Map(nodes.map(n => [n.code, n]))
    const edges: { from: string; to: string }[] = []
    for (const n of nodes) {
        for (const p of n.prerequisites) {
            if (byCode.has(p)) edges.push({ from: p, to: n.code })
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-cream/50">
                Competency graph
            </p>
            <div className="flex flex-wrap gap-2">
                {nodes.map(n => (
                    <Link
                        key={n.id}
                        href={n.status === 'locked' ? '#' : n.href}
                        onClick={e => n.status === 'locked' && e.preventDefault()}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            STATUS_COLOR[n.status] ?? STATUS_COLOR.upcoming
                        } ${n.status === 'locked' ? 'cursor-not-allowed' : 'hover:border-glow/50'}`}
                        title={n.title}
                    >
                        {n.code.split('.').pop()}
                    </Link>
                ))}
            </div>
            {edges.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/5 pt-3">
                    {edges.slice(0, 8).map((e, i) => (
                        <li key={i} className="text-[10px] text-cream/40 font-mono">
                            {e.from.split('.').pop()} → {e.to.split('.').pop()}
                        </li>
                    ))}
                    {edges.length > 8 && (
                        <li className="text-[10px] text-cream/30">+{edges.length - 8} more links</li>
                    )}
                </ul>
            )}
        </div>
    )
}
