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

        // If the user is not the specific admin ID, redirect immediately
        if (userId !== process.env.ADMIN_CLERK_ID) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}