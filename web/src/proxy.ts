import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const publicRoutes = ['/', '/sign-in', '/sign-up', '/api/v1/health']

export default clerkMiddleware(async (auth, request) => {
    const { pathname } = new URL(request.url)

    const isPublic = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    )

    if (!isPublic) {
        await auth.protect()
    }

    // ADMIN ROUTE PROTECTION
    if (pathname.startsWith('/admin')) {
        const { userId } = await auth()

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
            'connect-src': ['https:', 'wss:'],
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
