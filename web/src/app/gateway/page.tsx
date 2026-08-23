'use client'

/**
 * /gateway — The Pre-A1 Gateway route (Phase 10).
 *
 * A dedicated, chrome-less environment for the continuous simulation.
 * The learner enters, plays the six scenarios unbroken, and graduates
 * with evidence — not a grade.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import GatewayPlayer from '@/components/ecla/GatewayPlayer'
import GraduationCard from '@/components/ecla/GraduationCard'
import type { GatewayEvidence } from '@/lib/gatewayTypes'

export default function GatewayPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [evidence, setEvidence] = useState<GatewayEvidence[] | null>(null)

    // Post-graduation: show the evidence card
    if (evidence) {
        return (
            <GraduationCard
                evidence={evidence}
                onContinue={() => router.push('/course')}
            />
        )
    }

    // Active simulation: full-screen, chrome-less
    return (
        <GatewayPlayer
            getToken={getToken}
            onGraduate={setEvidence}
        />
    )
}