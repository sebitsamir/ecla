'use client'

/**
 * ContinueCards — nearby curriculum as "x / y demonstrated" + can-do,
 * never as a lesson menu. Each card routes to the first open competency.
 */
import Link from 'next/link'
import type { UnitCard } from '@/lib/summary'

export default function ContinueCards({ units }: { units: UnitCard[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {units.map(u => (
                <div key={u.id} className="flex flex-col rounded-2xl border border-white/10 bg-[#13131B] p-5">
                    <p className="mb-1 text-sm font-semibold text-cream">{u.title}</p>
                    <p className="mb-4 text-xs text-cream/50">{u.demonstrated} / {u.total} demonstrated</p>
                    <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/5">
                        <div
                            className="h-full bg-violet-500 transition-all duration-500"
                            style={{ width: `${u.total ? (u.demonstrated / u.total) * 100 : 0}%` }}
                        />
                    </div>
                    {u.href ? (
                        <Link
                            href={u.href}
                            className="mt-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-bold text-cream/80 transition-colors hover:bg-white/10"
                        >
                            {u.demonstrated > 0 ? 'Continue' : 'Start'}
                        </Link>
                    ) : (
                        <p className="mt-auto text-center text-xs font-bold text-leaf">Demonstrated ✓</p>
                    )}
                </div>
            ))}
        </div>
    )
}