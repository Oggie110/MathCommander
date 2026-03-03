import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SwishPaymentStatus, CreatePaymentResponse } from '@/types/swish';
import {
  createPayment,
  getPaymentStatus,
  isMobileDevice,
  openSwishApp,
} from '@/utils/swishClient';

interface SwishPaymentProps {
  /** Amount in SEK */
  amount: string;
  /** Message shown in Swish app (max 50 chars) */
  message?: string;
  /** Merchant reference for your booking system */
  reference?: string;
  /** Called when payment succeeds */
  onSuccess?: (paymentId: string) => void;
  /** Called when payment fails or is cancelled */
  onError?: (error: string) => void;
  /** Called when user cancels before completing */
  onCancel?: () => void;
}

type PaymentState =
  | 'idle'
  | 'creating'
  | 'awaiting_payment'
  | 'paid'
  | 'declined'
  | 'error'
  | 'cancelled'
  | 'timeout';

const STATUS_POLL_INTERVAL = 2000;
const STATUS_POLL_TIMEOUT = 180000; // 3 minutes

export const SwishPayment: React.FC<SwishPaymentProps> = ({
  amount,
  message,
  reference,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [state, setState] = useState<PaymentState>('idle');
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = isMobileDevice();

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startPolling = useCallback(
    (paymentId: string) => {
      // Set timeout for the entire payment flow
      timeoutRef.current = setTimeout(() => {
        cleanup();
        setState('timeout');
        onError?.('Payment timed out');
      }, STATUS_POLL_TIMEOUT);

      pollRef.current = setInterval(async () => {
        try {
          const status = await getPaymentStatus(paymentId);
          handleStatusUpdate(status.status, paymentId);
        } catch {
          // Ignore polling errors, will retry on next interval
        }
      }, STATUS_POLL_INTERVAL);
    },
    [cleanup, onError]
  );

  const handleStatusUpdate = useCallback(
    (status: SwishPaymentStatus, paymentId: string) => {
      switch (status) {
        case 'PAID':
          cleanup();
          setState('paid');
          onSuccess?.(paymentId);
          break;
        case 'DECLINED':
          cleanup();
          setState('declined');
          onError?.('Payment was declined');
          break;
        case 'CANCELLED':
          cleanup();
          setState('cancelled');
          onError?.('Payment was cancelled');
          break;
        case 'ERROR':
          cleanup();
          setState('error');
          onError?.('Payment error occurred');
          break;
        // CREATED is still in progress - keep polling
      }
    },
    [cleanup, onSuccess, onError]
  );

  const handleInitiatePayment = async () => {
    setState('creating');
    setErrorMessage('');

    try {
      const result = await createPayment({
        amount,
        message,
        payeePaymentReference: reference,
      });

      setPaymentData(result);
      setState('awaiting_payment');
      startPolling(result.id);

      // On mobile, automatically open the Swish app
      if (isMobile && result.swishUrl) {
        openSwishApp(result.swishUrl);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create payment';
      setState('error');
      setErrorMessage(msg);
      onError?.(msg);
    }
  };

  const handleCancel = () => {
    cleanup();
    setState('idle');
    setPaymentData(null);
    onCancel?.();
  };

  const handleRetry = () => {
    cleanup();
    setState('idle');
    setPaymentData(null);
    setErrorMessage('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Swish Logo Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#F5A623" />
            <path
              d="M7 13.5C7 13.5 9 10 12 10C15 10 17 13.5 17 13.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-gray-900 font-bold text-lg">Swish</span>
        </div>
      </div>

      {/* Amount Display */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-white">
          {amount} <span className="text-xl text-gray-400">SEK</span>
        </div>
        {message && (
          <div className="text-gray-400 text-sm mt-1">{message}</div>
        )}
      </div>

      {/* Payment States */}
      {state === 'idle' && (
        <button
          onClick={handleInitiatePayment}
          className="w-full py-4 px-6 bg-[#F5A623] hover:bg-[#E09500] text-white font-bold text-lg rounded-lg transition-colors"
        >
          Pay with Swish
        </button>
      )}

      {state === 'creating' && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Creating payment...</p>
        </div>
      )}

      {state === 'awaiting_payment' && (
        <div className="text-center">
          {isMobile ? (
            /* Mobile: Deep link flow */
            <div className="space-y-4">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm mb-3">
                  The Swish app should have opened. Complete the payment there.
                </p>
                <p className="text-gray-400 text-xs">
                  If Swish didn't open automatically:
                </p>
              </div>
              {paymentData?.swishUrl && (
                <button
                  onClick={() => openSwishApp(paymentData.swishUrl!)}
                  className="w-full py-3 px-6 bg-[#F5A623] hover:bg-[#E09500] text-white font-bold rounded-lg transition-colors"
                >
                  Open Swish App
                </button>
              )}
            </div>
          ) : (
            /* Desktop: QR Code flow */
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Scan the QR code with your Swish app
              </p>
              {paymentData?.qrContent && (
                <div className="inline-block bg-white p-4 rounded-lg">
                  <QRCodeDisplay content={paymentData.qrContent} size={200} />
                </div>
              )}
              {!paymentData?.qrContent && (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
                  <p className="text-gray-400 text-sm">
                    QR code not available. Use the Swish app to scan manually.
                  </p>
                  {paymentData?.token && (
                    <p className="text-gray-500 text-xs mt-2 font-mono break-all">
                      Token: {paymentData.token}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Waiting indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            Waiting for payment...
          </div>

          <button
            onClick={handleCancel}
            className="mt-4 text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'paid' && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">&#10003;</div>
          <p className="text-green-400 text-lg font-bold">Payment Successful!</p>
          <p className="text-gray-400 text-sm mt-2">
            {amount} SEK has been paid via Swish
          </p>
        </div>
      )}

      {(state === 'declined' || state === 'cancelled') && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">&#10007;</div>
          <p className="text-yellow-400 text-lg font-bold">
            {state === 'declined' ? 'Payment Declined' : 'Payment Cancelled'}
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {(state === 'error' || state === 'timeout') && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">&#9888;</div>
          <p className="text-red-400 text-lg font-bold">
            {state === 'timeout' ? 'Payment Timed Out' : 'Payment Error'}
          </p>
          {errorMessage && (
            <p className="text-gray-400 text-sm mt-2">{errorMessage}</p>
          )}
          <button
            onClick={handleRetry}
            className="mt-4 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Simple QR code renderer using SVG.
 * Generates a basic QR-like grid pattern from the content string.
 * For production, replace with a proper QR encoding library (e.g., qrcode).
 */
const QRCodeDisplay: React.FC<{ content: string; size: number }> = ({
  content,
  size,
}) => {
  // Generate a deterministic pattern from content for visual placeholder
  // In production, use a real QR code library like 'qrcode' or 'qrcode.react'
  const modules = 25;
  const cellSize = size / modules;

  const getCell = (row: number, col: number): boolean => {
    // Finder patterns (top-left, top-right, bottom-left)
    const isFinderPattern = (r: number, c: number) => {
      const inBox = (br: number, bc: number) =>
        r >= br && r < br + 7 && c >= bc && c < bc + 7;
      if (!inBox(0, 0) && !inBox(0, modules - 7) && !inBox(modules - 7, 0))
        return null;
      const [br, bc] = inBox(0, 0)
        ? [0, 0]
        : inBox(0, modules - 7)
          ? [0, modules - 7]
          : [modules - 7, 0];
      const lr = r - br;
      const lc = c - bc;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    };

    const finder = isFinderPattern(row, col);
    if (finder !== null) return finder;

    // Data pattern from content hash
    const charCode = content.charCodeAt((row * modules + col) % content.length);
    return ((charCode * (row + 1) * (col + 1)) % 3) === 0;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {Array.from({ length: modules }, (_, row) =>
        Array.from({ length: modules }, (_, col) =>
          getCell(row, col) ? (
            <rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
};
