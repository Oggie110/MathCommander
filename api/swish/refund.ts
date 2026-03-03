/**
 * POST /api/swish/refund
 *
 * Creates a Swish refund request (v2 API).
 * Refunds can be full or partial, up to the original payment amount.
 *
 * Required env vars: same as create-payment.ts
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  prefix: 'ratelimit:swish:refund',
});

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateInstructionId(): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export default async function handler(
  req: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string | string[] | undefined>;
  },
  res: {
    status: (code: number) => { json: (body: unknown) => void; end: () => void };
    setHeader: (key: string, value: string) => void;
  }
) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Rate limiting
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(',')[0]
      ?.trim() || 'unknown';
  const { success: rateLimitOk } = await ratelimit.limit(ip);
  if (!rateLimitOk) {
    res.status(429).json({ error: 'Too Many Requests' });
    return;
  }

  // Parse body
  let body = req.body as Record<string, unknown> | string | undefined;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  const params = body as {
    originalPaymentReference?: string;
    amount?: string;
    message?: string;
  } | undefined;

  if (!params?.originalPaymentReference || !params?.amount) {
    res
      .status(400)
      .json({ error: 'originalPaymentReference and amount are required' });
    return;
  }

  // Validate amount
  const amountNum = parseFloat(params.amount);
  if (isNaN(amountNum) || amountNum < 1 || amountNum > 999999999999.99) {
    res
      .status(400)
      .json({ error: 'Invalid refund amount (1.00 - 999999999999.99 SEK)' });
    return;
  }

  const payerAlias = process.env.SWISH_PAYEE_ALIAS;
  const apiUrl = process.env.SWISH_API_URL || 'https://mss.cpc.getswish.net';
  const callbackBaseUrl = process.env.SWISH_CALLBACK_BASE_URL;

  if (!payerAlias || !callbackBaseUrl) {
    res.status(500).json({ error: 'Swish not configured' });
    return;
  }

  const refundId = generateInstructionId();
  const callbackIdentifier = generateUUID();

  const swishPayload = {
    originalPaymentReference: params.originalPaymentReference,
    callbackUrl: `${callbackBaseUrl}/api/swish/callback`,
    payerAlias,
    amount: params.amount,
    currency: 'SEK',
    message: (params.message || 'Sauna booking refund').slice(0, 50),
    callbackIdentifier,
  };

  try {
    const endpoint = `${apiUrl}/swish-cpcapi/api/v2/refunds/${refundId}`;

    const swishRes = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swishPayload),
    });

    if (swishRes.status === 201) {
      const location = swishRes.headers.get('Location') || '';

      await redis.set(
        `swish:refund:${refundId}`,
        JSON.stringify({
          refundId,
          callbackIdentifier,
          originalPaymentReference: params.originalPaymentReference,
          amount: params.amount,
          status: 'CREATED',
          createdAt: new Date().toISOString(),
        }),
        { ex: 86400 }
      );

      res.status(201).json({ id: refundId, location });
    } else {
      const errorBody = await swishRes.text();
      console.error('[Swish] Refund creation failed:', swishRes.status, errorBody);
      res.status(swishRes.status).json({
        error: 'Swish refund creation failed',
        details: errorBody,
      });
    }
  } catch (err) {
    console.error('[Swish] Refund request error:', err);
    res.status(500).json({ error: 'Failed to contact Swish API' });
  }
}
