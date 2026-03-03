import type {
  CreatePaymentParams,
  CreatePaymentResponse,
  PaymentStatusResponse,
  CreateRefundResponse,
} from '@/types/swish';

const API_BASE = '/api/swish';

async function jsonFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (body as { error?: string }).error || `Request failed: ${res.status}`
    );
  }

  // 204 No Content
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/** Create a Swish payment request */
export async function createPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResponse> {
  return jsonFetch<CreatePaymentResponse>(`${API_BASE}/create-payment`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Poll payment status */
export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  return jsonFetch<PaymentStatusResponse>(
    `${API_BASE}/status?id=${encodeURIComponent(paymentId)}`
  );
}

/** Create a refund for a completed payment */
export async function createRefund(params: {
  originalPaymentReference: string;
  amount: string;
  message?: string;
}): Promise<CreateRefundResponse> {
  return jsonFetch<CreateRefundResponse>(`${API_BASE}/refund`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Detect if user is on a mobile device (for choosing deep link vs QR) */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** Open Swish app via deep link (mobile only) */
export function openSwishApp(swishUrl: string): void {
  window.location.href = swishUrl;
}
