import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SwishPayment } from '@/components/ui/SwishPayment';
import { SpaceBackground } from '@/components/game';
import { ArrowLeft } from 'lucide-react';

const SwishPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Read booking details from URL params
  const amount = searchParams.get('amount') || '100';
  const message = searchParams.get('message') || 'Sauna booking';
  const reference = searchParams.get('ref') || undefined;
  const returnTo = searchParams.get('return') || '/';

  const handleSuccess = (paymentId: string) => {
    setPaymentComplete(true);
    console.log('[SwishPayment] Payment succeeded:', paymentId);
  };

  const handleError = (error: string) => {
    console.error('[SwishPayment] Payment error:', error);
  };

  const handleCancel = () => {
    navigate(returnTo);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative min-h-screen">
      <SpaceBackground />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(returnTo)}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold text-white">Payment</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Payment Card */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6">
          {!paymentComplete ? (
            <SwishPayment
              amount={amount}
              message={message}
              reference={reference}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">&#10003;</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-400 mb-6">
                Your sauna session has been booked and paid for.
              </p>
              <button
                onClick={() => navigate(returnTo)}
                className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-gray-600 text-xs text-center">
          <p>Payments processed securely via Swish</p>
          <p className="mt-1">Amount: {amount} SEK | Currency: SEK only</p>
        </div>
      </div>
    </div>
  );
};

export default SwishPaymentPage;
