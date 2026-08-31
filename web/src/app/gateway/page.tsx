'use client'

import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'

export default function GatewayPage() {
    return (
        <AppShell>
            <section className="mx-auto max-w-xl space-y-5 rounded-2xl border border-white/10 p-6">
                <h1 className="text-2xl font-bold text-cream">Gateway assessment is being rebuilt</h1>
                <p className="text-cream/70">
                    Graduation is paused until server-owned conversations and reviewed
                    assessment rubrics can verify each objective. Practice remains available;
                    it does not award graduation or mastery.
                </p>
                <Link href="/course" className="inline-block rounded-xl bg-glow px-5 py-3 font-bold text-night-900">
                    Back to practice
                </Link>
            </section>
        </AppShell>
    )
}
