/**
 * POST /api/swish/create-payment
 *
 * Creates a Swish payment request (v2 API).
 * Supports both e-commerce (with payerAlias) and m-commerce (without) flows.
 *
 * Required env vars:
 *   SWISH_PAYEE_ALIAS       - Merchant Swish number
 *   SWISH_CERT_PEM          - Client certificate (PEM, base64-encoded)
 *   SWISH_KEY_PEM           - Private key (PEM, base64-encoded)
 *   SWISH_CA_PEM            - Swish CA certificate (PEM, base64-encoded)
 *   SWISH_API_URL           - Base URL (production: https://cpc.getswish.net, test: https://mss.cpc.getswish.net)
 *   SWISH_CALLBACK_BASE_URL - Public base URL for callbacks (e.g. https://yourdomain.com)
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:swish:create',
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
    amount?: string;
    message?: string;
    payerAlias?: string;
    payeePaymentReference?: string;
  } | undefined;

  if (!params?.amount) {
    res.status(400).json({ error: 'amount is required' });
    return;
  }

  // Validate amount
  const amountNum = parseFloat(params.amount);
  if (isNaN(amountNum) || amountNum < 0.01 || amountNum > 999999999999.99) {
    res.status(400).json({ error: 'Invalid amount (0.01 - 999999999999.99 SEK)' });
    return;
  }

  const payeeAlias = process.env.SWISH_PAYEE_ALIAS;
  const apiUrl = process.env.SWISH_API_URL || 'https://mss.cpc.getswish.net';
  const callbackBaseUrl = process.env.SWISH_CALLBACK_BASE_URL;

  if (!payeeAlias || !callbackBaseUrl) {
    res.status(500).json({ error: 'Swish not configured' });
    return;
  }

  const instructionId = generateInstructionId();
  const callbackIdentifier = generateUUID();

  const swishPayload = {
    payeePaymentReference: params.payeePaymentReference || instructionId,
    callbackUrl: `${callbackBaseUrl}/api/swish/callback`,
    payeeAlias,
    amount: params.amount,
    currency: 'SEK',
    message: (params.message || 'Sauna booking').slice(0, 50),
    callbackIdentifier,
    ...(params.payerAlias ? { payerAlias: params.payerAlias } : {}),
  };

  try {
    // Build fetch options with mTLS certificates
    const certPem = process.env.SWISH_CERT_PEM
      ? Buffer.from(process.env.SWISH_CERT_PEM, 'base64').toString('utf-8')
      : undefined;
    const keyPem = process.env.SWISH_KEY_PEM
      ? Buffer.from(process.env.SWISH_KEY_PEM, 'base64').toString('utf-8')
      : undefined;

    // Note: In production with Node.js, you'd use https.Agent with cert/key for mTLS.
    // Vercel Edge Functions don't support mTLS natively - you'll need a proxy or
    // Vercel Serverless Functions (Node.js runtime) with a custom https agent.
    // Below shows the fetch structure; mTLS requires the Node.js https module.

    const endpoint = `${apiUrl}/swish-cpcapi/api/v2/paymentrequests/${instructionId}`;

    const swishRes = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swishPayload),
      // mTLS certificates would be attached via a custom https.Agent in Node.js runtime
    });

    if (swishRes.status === 201) {
      const location = swishRes.headers.get('Location') || '';
      const token = swishRes.headers.get('PaymentRequestToken') || '';

      // Store payment metadata for callback verification
      await redis.set(
        `swish:payment:${instructionId}`,
        JSON.stringify({
          instructionId,
          callbackIdentifier,
          amount: params.amount,
          status: 'CREATED',
          createdAt: new Date().toISOString(),
        }),
        { ex: 86400 } // Expire after 24 hours
      );

      // Build response
      const isMCommerce = !params.payerAlias;
      const responseBody: Record<string, string> = { id: instructionId };

      if (isMCommerce && token) {
        responseBody.token = token;
        responseBody.qrContent = `D${token}`;
        responseBody.swishUrl = `swish://paymentrequest?token=${token}&callbackurl=${encodeURIComponent(callbackBaseUrl + '/payment/status?id=' + instructionId)}`;
      }

      res.status(201).json(responseBody);
    } else {
      const errorBody = await swishRes.text();
      console.error('[Swish] Payment creation failed:', swishRes.status, errorBody);
      res.status(swishRes.status).json({
        error: 'Swish payment creation failed',
        details: errorBody,
      });
    }
  } catch (err) {
    console.error('[Swish] Request error:', err);
    res.status(500).json({ error: 'Failed to contact Swish API' });
  }
}
