import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:track',
});

export default async function handler(req: { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }, res: { status: (code: number) => { json: (body: unknown) => void; end: () => void }; setHeader: (key: string, value: string) => void }) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const forwarded = req.headers?.['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || 'unknown';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
        res.status(429).json({ error: 'Too Many Requests' });
        return;
    }

    let body = req.body as { event?: string } | string | undefined;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            body = undefined;
        }
    }

    const event = (body as { event?: string } | undefined)?.event;
    if (event !== 'game_start') {
        res.status(400).json({ error: 'Unknown event' });
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = `stats:game_start:${today}`;
    const totalKey = 'stats:game_start:total';

    await Promise.all([
        redis.incr(dailyKey),
        redis.incr(totalKey),
        redis.expire(dailyKey, 90 * 86400),
    ]);

    res.status(204).end();
}
