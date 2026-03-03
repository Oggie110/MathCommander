/**
 * POST /api/swish/callback
 *
 * Receives payment/refund result callbacks from Swish.
 * Swish sends a POST with JSON body containing payment status.
 * Validates callbackIdentifier against stored value for security.
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

  let body = req.body as Record<string, unknown> | string | undefined;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  const callback = body as {
    id?: string;
    paymentReference?: string;
    originalPaymentReference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    datePaid?: string;
    dateCreated?: string;
    errorCode?: string;
    errorMessage?: string;
    payerAlias?: string;
    payeeAlias?: string;
    message?: string;
  } | undefined;

  if (!callback?.id || !callback?.status) {
    res.status(400).json({ error: 'Missing id or status in callback' });
    return;
  }

  // Validate callbackIdentifier header against stored value
  const callbackIdentifier =
    req.headers?.['callbackidentifier'] ||
    req.headers?.['callbackIdentifier'];
  const headerValue = Array.isArray(callbackIdentifier)
    ? callbackIdentifier[0]
    : callbackIdentifier;

  // Determine if this is a payment or refund callback
  const isRefund = !!callback.originalPaymentReference;
  const storageKey = isRefund
    ? `swish:refund:${callback.id}`
    : `swish:payment:${callback.id}`;

  // Retrieve stored payment/refund data
  const storedRaw = await redis.get(storageKey);
  if (storedRaw) {
    const stored =
      typeof storedRaw === 'string' ? JSON.parse(storedRaw) : storedRaw;

    // Verify callbackIdentifier matches
    if (
      stored.callbackIdentifier &&
      headerValue &&
      stored.callbackIdentifier !== headerValue
    ) {
      console.error(
        '[Swish Callback] callbackIdentifier mismatch:',
        stored.callbackIdentifier,
        '!==',
        headerValue
      );
      res.status(403).json({ error: 'Invalid callback identifier' });
      return;
    }

    // Update payment status
    stored.status = callback.status;
    if (callback.datePaid) stored.datePaid = callback.datePaid;
    if (callback.errorCode) stored.errorCode = callback.errorCode;
    if (callback.errorMessage) stored.errorMessage = callback.errorMessage;
    if (callback.paymentReference)
      stored.paymentReference = callback.paymentReference;
    stored.updatedAt = new Date().toISOString();

    await redis.set(storageKey, JSON.stringify(stored), { ex: 86400 });

    console.log(
      `[Swish Callback] ${isRefund ? 'Refund' : 'Payment'} ${callback.id} -> ${callback.status}`
    );
  } else {
    // Payment not found in our store - log but still accept
    console.warn(
      `[Swish Callback] Unknown ${isRefund ? 'refund' : 'payment'} ID: ${callback.id}`
    );
  }

  // Always respond 200 to Swish to acknowledge receipt
  res.status(200).json({ received: true });
}
