/**
 * GET /api/swish/status?id={paymentId}
 *
 * Returns the current status of a Swish payment from our Redis store.
 * The frontend polls this endpoint to track payment progress.
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(
  req: {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  res: {
    status: (code: number) => { json: (body: unknown) => void; end: () => void };
    setHeader: (key: string, value: string) => void;
  }
) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Extract payment ID from query string
  const url = new URL(req.url || '', 'http://localhost');
  const paymentId = url.searchParams.get('id');

  if (!paymentId) {
    res.status(400).json({ error: 'Missing id parameter' });
    return;
  }

  // Validate format (32 hex chars)
  if (!/^[0-9A-F]{32}$/i.test(paymentId)) {
    res.status(400).json({ error: 'Invalid payment ID format' });
    return;
  }

  const storedRaw = await redis.get(`swish:payment:${paymentId}`);

  if (!storedRaw) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  const stored =
    typeof storedRaw === 'string' ? JSON.parse(storedRaw) : storedRaw;

  res.status(200).json({
    id: stored.instructionId || paymentId,
    status: stored.status || 'CREATED',
    amount: stored.amount,
    datePaid: stored.datePaid,
    errorCode: stored.errorCode,
    errorMessage: stored.errorMessage,
  });
}
