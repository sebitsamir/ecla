'use client'

import { API_URL } from '@/lib/apiClient'

/**
 * ConfidenceCheck — Phase 36: learner self-report (does not determine mastery).
 */
const LEVELS = [
    { level: 1, emoji: '😣', label: 'Difficult' },
    { level: 2, emoji: '😐', label: 'Okay' },
    { level: 3, emoji: '🙂', label: 'Comfortable' },
    { level: 4, emoji: '🔥', label: 'Easy' },
]

export default function ConfidenceCheck({
    competencyId,
    getToken,
    onDone,
}: {
    competencyId: string
    getToken: () => Promise<string | null>
    onDone?: () => void
}) {
    const submit = async (level: number) => {
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/learner/confidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ competencyId, level }),
            })
        } catch { /* non-blocking */ }
        onDone?.()
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
            <p className="mb-3 text-sm text-cream/70">How did that feel?</p>
            <div className="grid grid-cols-4 gap-2">
                {LEVELS.map(l => (
                    <button
                        key={l.level}
                        onClick={() => submit(l.level)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] py-2 text-center transition-colors hover:border-glow/40"
                        aria-label={l.label}
                    >
                        <span className="text-lg">{l.emoji}</span>
                        <span className="mt-1 block text-[9px] font-semibold text-cream/50">{l.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
