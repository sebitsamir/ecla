import { Request } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { prisma } from './prisma'
import { AppError } from './errors'

// USER CACHE: 60s TTL, bounded to 500 users
const userCache = new Map<string, { at: number; user: any }>()

export async function getOrSyncUserFast(req: any) {
    const id = req.auth?.userId
    if (!id) return getOrSyncUser(req)
    
    const hit = userCache.get(id)
    if (hit && Date.now() - hit.at < 60_000) {
        return hit.user
    }
    
    const user = await getOrSyncUser(req)
    userCache.set(id, { at: Date.now(), user })
    
    // Prevent memory leaks
    if (userCache.size > 500) {
        const now = Date.now()
        for (const [k, v] of userCache) {
            if (now - v.at > 60_000) userCache.delete(k)
        }
    }
    
    return user
}

export function requireAuth(req: Request): string {
    const { userId } = getAuth(req)
    if (!userId) {
        throw new AppError('Unauthorized', 401)
    }
    return userId
}

export function requireAdmin(req: Request): string {
    const userId = requireAuth(req)
    if (userId !== process.env.ADMIN_CLERK_ID) {
        throw new AppError('Forbidden: Admin access only', 403)
    }
    return userId
}

export async function getClerkEmail(userId: string): Promise<string> {
    try {
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.primaryEmailAddress?.emailAddress ??
            clerkUser.emailAddresses?.[0]?.emailAddress ??
            null
        return email ?? `${userId}@unknown.local`
    } catch {
        return `${userId}@unknown.local`
    }
}

export async function getOrSyncUser(req: Request) {
    const userId = requireAuth(req)
    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user) return user

    const email = await getClerkEmail(userId)
    const ghostUser = await prisma.user.findUnique({ where: { email } })

    if (ghostUser) {
        user = await prisma.user.update({
            where: { id: ghostUser.id },
            data: { clerkId: userId, onboardingCompleted: false },
        })
    } else {
        user = await prisma.user.create({
            data: { clerkId: userId, email, onboardingCompleted: false },
        })
    }

    return user
}