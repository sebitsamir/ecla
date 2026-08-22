'use client'

/**
 * useGrader — two-layer assessment (Constitution Arts. 16/18).
 * Layer 1 (form):  local tolerant matching — normalize, variants, typos. Free.
 * Layer 2 (function): AI judge decides whether MEANING was communicated.
 * The judge is only called when the form layer is unsure (cheap + rare).
 * Infra failure never counts against the learner.
 */
import { useCallback } from 'react'
import { gradeLocal } from '@/lib/grading'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export type GradeTarget = { expected: string[]; accept?: string[]; open?: boolean }
export type GradeResult = { ok: boolean; method: 'exact' | 'normalized' | 'variant' | 'fuzzy' | 'ai' | null }

export function useGrader(getToken: () => Promise<string | null>) {
    return useCallback(
        async (text: string, target: GradeTarget): Promise<GradeResult> => {
            // Layer 1 — form.
            const local = gradeLocal(text, {
                type: 'recall',
                answer: target.expected[0] ?? '',
                accept: [...target.expected.slice(1), ...(target.accept ?? [])],
            })
            if (local.correct) return { ok: true, method: local.method }

            // Layer 2 — function (only for open answers or near-misses).
            if (target.open || local.needsJudge) {
                try {
                    const token = await getToken()
                    const res = await fetch(`${API_URL}/api/v1/lessons/grade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            answer: text,
                            expected: target.expected.join(' / '),
                            accept: target.accept ?? [],
                        }),
                    })
                    if ((await res.json()).correct) return { ok: true, method: 'ai' }
                } catch {
                    // Judge unreachable → treat as not-ok, never as learner failure.
                }
            }
            return { ok: false, method: null }
        },
        [getToken],
    )
}