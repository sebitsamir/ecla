'use client'
import AssessmentRunner from '@/components/assessment/AssessmentRunner'
import { useAuthReady } from '@/hooks/useAuthReady'
export default function MissionRunner({ competencyId, onClose }: { competencyId: string; onClose: () => void }) {
    const { getToken } = useAuthReady()
    return <AssessmentRunner kind="mission" competencyId={competencyId} getToken={getToken} onExit={onClose} />
}
