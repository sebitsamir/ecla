'use client'

/**
 * ApiState — Phase 40: meaningful error UI with next action.
 */
import { ApiError } from '@/lib/apiClient'

export default function ApiState({
    error,
    onRetry,
}: {
    error: ApiError | string | null
    onRetry?: () => void
}) {
    if (!error) return null
    const err = typeof error === 'string' ? new ApiError('server', error) : error

    const action = err.kind === 'unauthorized'
        ? 'Sign in again to continue.'
        : err.kind === 'rate_limit'
            ? 'Wait a few seconds, then retry.'
            : err.retryable
                ? 'Try again in a moment.'
                : 'Go back and pick another activity.'

    return (
        <div className="rounded-2xl border border-coral/30 bg-coral/5 p-4 sm:p-5" role="alert">
            <p className="text-sm font-semibold text-coral">{err.message}</p>
            <p className="mt-1 text-xs text-cream/50">{action}</p>
            {onRetry && err.retryable && (
                <button
                    onClick={onRetry}
                    className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-cream hover:bg-white/10"
                >
                    Retry
                </button>
            )}
        </div>
    )
}
