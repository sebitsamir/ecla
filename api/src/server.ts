import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { PrismaClient } from '@prisma/client';

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
            create: { clerkId: userId, email },
        });

        res.json({ synced: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Fluenta API running on http://localhost:${PORT}`);
});