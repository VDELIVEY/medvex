'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CreditCard, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: string;
  defaultAmount?: number;
  onSuccess?: (data: any) => void;
}

export default function CollectUGPaymentModal({
  isOpen,
  onClose,
  episodeId,
  defaultAmount = 1000,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Card states
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');

  // Status & Polling states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTxnId, setPendingTxnId] = useState<string | null>(null);
  const [pendingMerchantReference, setPendingMerchantReference] = useState<string | null>(null);
  const [isAutoConfirmed, setIsAutoConfirmed] = useState<boolean>(false);
  const [manualChecking, setManualChecking] = useState<boolean>(false);
  const [noTxnId, setNoTxnId] = useState<boolean>(false);
  const pollCountRef = useRef<number>(0);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount or close
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Automatic Confirmation Polling Effect
  useEffect(() => {
    if (!pendingTxnId || isAutoConfirmed) return;

    pollCountRef.current = 0;

    pollIntervalRef.current = setInterval(async () => {
      try {
        pollCountRef.current += 1;
        const res = await fetch(`/api/payments/verify?transaction_id=${pendingTxnId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Payment verification failed. Please contact support.');
          setLoading(false);
          return;
        }

        if (data.status === 'completed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsAutoConfirmed(true);
          setLoading(false);

          if (onSuccess) {
            onSuccess(data.transaction || { transaction_id: pendingTxnId, status: 'completed' });
          }
        } else if (data.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setError('Payment was declined or failed on phone.');
          setLoading(false);
          setPendingTxnId(null);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Network error while checking payment status. Please check your connection.');
      }
    }, 3000);

    // Stop polling after 2 minutes (40 attempts)
    const timeoutId = setTimeout(() => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setLoading(false);
      setError('Payment verification timed out. Please check the patient\'s phone or try again.');
    }, 120000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearTimeout(timeoutId);
    };
  }, [pendingTxnId, isAutoConfirmed, onSuccess]);

  if (!isOpen) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsAutoConfirmed(false);
    setPendingTxnId(null);
    setPendingMerchantReference(null);
    setManualChecking(false);
    pollCountRef.current = 0;

    try {
      const payload: any = {
        episodeId,
        amount: Number(amount),
        customerEmail: customerEmail || undefined,
      };

      if (paymentMethod === 'momo') {
        if (!phoneNumber) {
          throw new Error('Please enter a valid Mobile Money phone number.');
        }
        payload.phoneNumber = phoneNumber;
      } else {
        if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
          throw new Error('Please fill in all card payment details.');
        }
        payload.cardNumber = cardNumber;
        payload.cardholderName = cardholderName;
        payload.expiryDate = expiryDate;
        payload.cvv = cvv;
      }

      const res = await fetch('/api/payments/collectug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment initiation failed.');
      }

      const txnId = data.data?.transaction?.transaction_id;
      const merchantReference = data.merchantReference;
      setPendingMerchantReference(merchantReference || null);
      if (txnId) {
        setPendingTxnId(txnId);
      } else if (merchantReference) {
        setNoTxnId(true);
        setLoading(false);
      } else {
        setNoTxnId(true);
        setLoading(false);
        setError(
          'Payment was initiated on the patient\'s phone, but we have not yet received a transaction reference from CollectUG. Ask the patient to confirm the PIN prompt, then use "Check Status" below.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment.');
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!phoneNumber && !cardNumber) {
      setError('Enter payment details first before checking status manually.');
      return;
    }
    setManualChecking(true);
    setError(null);
    try {
      if (!pendingMerchantReference) throw new Error('No provider reference is available for verification. Payment remains unconfirmed.');
      const res = await fetch(`/api/payments/verify?merchant_reference=${encodeURIComponent(pendingMerchantReference)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Payment verification failed.');
      if (data.status === 'completed') {
        setIsAutoConfirmed(true);
        setLoading(false);
        setPendingTxnId(null);
        if (onSuccess) onSuccess(data.transaction);
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        setError('The provider reports this payment failed. The episode remains unpaid.');
      } else {
        setError('No settlement confirmation yet. Payment remains pending.');
      }
    } catch (err: any) {
      setError(err.message || 'Manual check failed.');
    } finally {
      setManualChecking(false);
    }
  };

  const handleCloseModal = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPendingTxnId(null);
    setPendingMerchantReference(null);
    setIsAutoConfirmed(false);
    setNoTxnId(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <h3 className="font-semibold text-lg">CollectUG Payment</h3>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Automatic Confirmation Screen */}
        {isAutoConfirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
              Payment Automatically Confirmed!
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We received your payment of <span className="font-bold text-slate-900 dark:text-white">UGX {amount.toLocaleString()}</span> via CollectUG.
            </p>
            <button
              onClick={handleCloseModal}
              className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Done / Continue
            </button>
          </div>
        ) : noTxnId ? (
          /* No transaction reference received yet */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Awaiting Transaction Reference
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The payment prompt was sent to the patient's phone. If money was deducted, do NOT retry — that may double-charge them.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={manualChecking}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {manualChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Check Payment Status</span>
                )}
              </button>

            </div>
          </div>
        ) : pendingTxnId ? (
          /* Waiting for User Phone PIN Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/60 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Prompt Sent to {phoneNumber}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please check your phone and enter your Mobile Money PIN to complete the transaction.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Waiting for automatic confirmation...</span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* Initial Payment Form */
          <form onSubmit={handlePayment} className="p-6 space-y-5">
            {/* Amount Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Payment Amount (UGX)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  UGX
                </span>
                <input
                  type="number"
                  min="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full pl-14 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium border text-sm transition-all ${
                    paymentMethod === 'momo'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium border text-sm transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Visa / Card</span>
                </button>
              </div>
            </div>

            {/* Mobile Money Form */}
            {paymentMethod === 'momo' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (MTN / Airtel)
                  </label>
                  <input
                    type="tel"
                    placeholder="0776913451 or 0701234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    A PIN prompt will pop up on this phone automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              /* Card Form */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4111 1111 1111 1111"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Feedback banners */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Initiating Payment...</span>
                </>
              ) : (
                <span>Send Payment Prompt to Patient</span>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              This will send a payment request to the patient's phone. Do not retry if the prompt already appeared — it may double-charge.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
