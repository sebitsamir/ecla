import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const app = express();

app.use(cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
}));

app.use(express.json());
app.use(clerkMiddleware());

app.get('/api/v1/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
    } catch (e) {
        res.status(500).json({ status: 'error', db: 'disconnected' });
    }
});

app.post('/api/v1/sync-user', async (req, res) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const email = req.auth?.sessionClaims?.email as string || 'unknown';

        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { email },
            create: {
                clerkId: userId,
                email,
            },
        });

        res.json({
            synced: true,
            user,
            onboardingCompleted: user.onboardingCompleted ?? false,
        });
    } catch (error) {
        console.error('Sync user error:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});

const onboardingSchema = z.object({
    motivation: z.enum(['TRAVEL', 'HERITAGE', 'CAREER', 'FUN']),
    preferredMode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
    dailyGoalXp: z.number().int().min(1).max(1000),
    currentLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional(),
})

app.post('/api/v1/onboarding/complete', async (req, res) => {
    try {
        const { userId } = getAuth(req)

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const parsed = onboardingSchema.safeParse(req.body)

        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid onboarding data',
                details: parsed.error.flatten(),
            })
        }

        const { motivation, preferredMode, dailyGoalXp, currentLevel } = parsed.data

        const user = await prisma.user.update({
            where: { clerkId: userId },
            data: {
                motivation: motivation as any,
                preferredMode: preferredMode as any,
                dailyGoalXp,
                currentLevel: currentLevel ?? null,
                onboardingCompleted: true,
            },
        })

        res.json({
            success: true,
            user: {
                id: user.id,
                motivation: user.motivation,
                preferredMode: user.preferredMode,
                dailyGoalXp: user.dailyGoalXp,
                currentLevel: user.currentLevel,
                onboardingCompleted: user.onboardingCompleted,
            },
            onboardingCompleted: true,
        })
    } catch (error) {
        console.error('Onboarding complete error:', error)
        res.status(500).json({ error: 'Failed to save onboarding' })
    }
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Fluenta API running on http://localhost:${PORT}`);
});