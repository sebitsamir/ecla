export type AuthRouteKind = 'public' | 'page' | 'service'

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/api/v1/health'] as const

export function classifyAuthRoute(pathname: string): AuthRouteKind {
    const isPublic = PUBLIC_ROUTES.some(
        route => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)),
    )

    if (isPublic) return 'public'
    if (pathname === '/api' || pathname.startsWith('/api/') || pathname === '/trpc' || pathname.startsWith('/trpc/')) {
        return 'service'
    }
    return 'page'
}
