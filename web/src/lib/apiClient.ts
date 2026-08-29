/**
 * API client — Phase 40: structured errors with retry guidance.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export type ApiErrorKind =
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'validation'
    | 'rate_limit'
    | 'server'
    | 'network'

export class ApiError extends Error {
    kind: ApiErrorKind
    status?: number
    retryable: boolean

    constructor(kind: ApiErrorKind, message: string, status?: number) {
        super(message)
        this.kind = kind
        this.status = status
        this.retryable = kind === 'network' || kind === 'rate_limit' || kind === 'server'
    }
}

export async function apiFetch<T>(
    path: string,
    getToken: () => Promise<string | null>,
    init?: RequestInit,
): Promise<T> {
    let token: string | null = null
    try {
        token = await getToken()
        const res = await fetch(`${API_URL}${path}`, {
            ...init,
            headers: {
                ...(init?.headers ?? {}),
                Authorization: `Bearer ${token}`,
                ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
            },
        })
        if (res.status === 401) throw new ApiError('unauthorized', 'Please sign in again.', 401)
        if (res.status === 403) throw new ApiError('forbidden', 'You do not have access to this.', 403)
        if (res.status === 404) throw new ApiError('not_found', 'That resource was not found.', 404)
        if (res.status === 400) throw new ApiError('validation', (await res.json().catch(() => ({}))).error ?? 'Invalid request.', 400)
        if (res.status === 429) throw new ApiError('rate_limit', 'Too many requests. Wait a moment.', 429)
        if (!res.ok) throw new ApiError('server', 'Something went wrong on our end. Try again.', res.status)
        return await res.json() as T
    } catch (e) {
        if (e instanceof ApiError) throw e
        throw new ApiError('network', 'Could not reach the server. Check your connection.')
    }
}
