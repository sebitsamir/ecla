import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { classifyAuthRoute } from '@/lib/authRouting'

export default clerkMiddleware(async (auth, request) => {
    const { pathname } = new URL(request.url)
    const routeKind = classifyAuthRoute(pathname)
    let userId: string | null = null

    if (routeKind !== 'public') {
        const authState = await auth()
        userId = authState.userId

        if (!authState.isAuthenticated || !userId) {
            // Clerk intentionally answers unauthenticated non-document requests
            // with 404. App Router client navigations can use that request shape,
            // so page routes must recover through an explicit sign-in redirect.
            if (routeKind === 'page') {
                return authState.redirectToSignIn({ returnBackUrl: request.url })
            }

            // Preserve non-page semantics for API and tRPC requests.
            await auth.protect()
        }
    }

    // ADMIN ROUTE PROTECTION
    if (pathname.startsWith('/admin')) {
        const admins = new Set([process.env.ADMIN_CLERK_ID, ...(process.env.ADMIN_CLERK_IDS ?? '').split(',')].map(value => value?.trim()).filter(Boolean))
        const portfolioReviewers = new Set([...admins, ...(process.env.PORTFOLIO_REVIEWER_CLERK_IDS ?? '').split(',').map(value => value.trim()).filter(Boolean)])
        const allowed = pathname.startsWith('/admin/portfolio') ? !!userId && portfolioReviewers.has(userId) : !!userId && admins.has(userId)
        if (!allowed) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}, {
    contentSecurityPolicy: {
        directives: {
            'base-uri': ['self'],
            'connect-src': [
                'self',
                'https:',
                'wss:',
                ...(process.env.NODE_ENV === 'production'
                    ? []
                    : ['http://localhost:4000', 'http://127.0.0.1:4000']),
            ],
            'font-src': ['self', 'https://fonts.gstatic.com'],
            'frame-ancestors': ['none'],
            'img-src': ['data:', 'blob:', 'https:'],
            'media-src': ['self', 'blob:'],
            'object-src': ['none'],
        },
    },
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
