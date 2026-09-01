'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { useAuthReady } from '@/hooks/useAuthReady'
import { isAdaptationPlan, type AdaptationPlan } from '../../../../packages/contracts/adaptation'

const card = 'rounded-2xl border border-white/10 bg-[#13131B] p-5'

export default function PlanPage() {
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const [plan, setPlan] = useState<AdaptationPlan | null>(null)
    const [error, setError] = useState<ApiError | null>(null)

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return
        apiFetch<unknown>('/api/v1/adaptation/plan', getToken)
            .then(value => { if (!isAdaptationPlan(value)) throw new ApiError('server', 'The study plan response was invalid.'); setPlan(value) })
            .catch(value => setError(value instanceof ApiError ? value : new ApiError('network', 'Could not build your study plan.')))
    }, [isLoaded, isSignedIn, getToken])

    return <AppShell>
        {!isLoaded || (isSignedIn && !plan && !error) ? <p className="text-sm text-cream/60">Building your evidence-based plan…</p>
            : !isSignedIn ? <ApiState error={new ApiError('unauthorized', 'Please sign in to view your plan.', 401)} />
                : error ? <ApiState error={error} onRetry={() => window.location.reload()} />
                    : plan && <div className="space-y-6">
                        <header><p className="text-[11px] font-semibold uppercase tracking-widest text-glow">Automatic, explainable study plan</p><h1 className="font-display mt-1 text-3xl font-bold text-cream">Your next five actions</h1><p className="mt-2 text-sm text-cream/50">Built from server-owned attempts, recency, independence, context variety, and review timing.</p></header>
                        <div className="grid gap-4 md:grid-cols-2">
                            <section className={card}><p className="text-xs uppercase tracking-wider text-cream/50">Evidence placement</p><h2 className="mt-2 text-xl font-semibold capitalize text-cream">{plan.placement.band}</h2><p className="mt-2 text-sm text-cream/60">{plan.placement.explanation}</p></section>
                            <section className={card}><p className="text-xs uppercase tracking-wider text-cream/50">Confidence calibration</p><h2 className="mt-2 text-xl font-semibold capitalize text-cream">{plan.confidenceCalibration.state}</h2><p className="mt-2 text-sm text-cream/60">{plan.confidenceCalibration.explanation}</p></section>
                        </div>
                        {plan.repairPlan.length > 0 && <section className={card}><h2 className="font-semibold text-cream">Current repair plan</h2><div className="mt-3 space-y-3">{plan.repairPlan.map(item => <div key={item.error}><p className="text-sm font-medium text-glow">{item.error.replaceAll('_', ' ')} · {item.count}</p><p className="text-sm text-cream/60">{item.strategy}</p></div>)}</div></section>}
                        <ol className="space-y-4">{plan.actions.map(action => <li key={`${action.rank}-${action.competencyId ?? action.kind}`} className={card}><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glow font-bold text-night-900">{action.rank}</span><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wider text-cream/50">{action.kind} · {action.support} support · {action.mode.toLowerCase()}</p><h2 className="mt-1 text-lg font-semibold text-cream">{action.title}</h2><p className="mt-1 text-sm text-cream/60">{action.canDo}</p><p className="mt-3 text-sm text-cream/75">{action.reason}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-cream/45">{action.evidence.map(row => <li key={row}>{row}</li>)}</ul><Link href={action.href} className="mt-4 inline-flex rounded-xl bg-glow px-4 py-2 text-sm font-bold text-night-900">Start this action</Link></div></div></li>)}</ol>
                    </div>}
    </AppShell>
}
