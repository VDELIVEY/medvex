"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { 
  CreditCard, Banknote, Smartphone, Search, 
  User, Receipt, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, DollarSign, Wallet, ShieldCheck, Stethoscope
} from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CashierPortal() {
  return (
    <RoleGuard allowedRole="cashier">
      <CashierContent />
    </RoleGuard>
  );
}

function CashierContent() {
  const { setActiveEpisode } = useApp();
  const [step, setStep] = useState<'search' | 'results' | 'payment' | 'checking' | 'paid'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [episodeData, setEpisodeData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('1000');
  const [pollAttempt, setPollAttempt] = useState(1);
  const [checkingMessage, setCheckingMessage] = useState('Initiating payment transaction...');
  const [receiptNumber, setReceiptNumber] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Try searching by code first
      const res = await fetch(`/api/episodes?code=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (res.ok && data.episode) {
        selectEpisode(data.episode);
      } else {
        // Try searching by name
        const resName = await fetch(`/api/episodes?name=${encodeURIComponent(searchQuery)}`);
        const dataName = await resName.json();
        if (resName.ok && dataName.episodes?.length > 0) {
          setSearchResults(dataName.episodes);
          setStep('results');
        } else {
          alert('No matching episodes found');
        }
      }
    } catch (err) {
      alert('Network error during search');
    } finally {
      setLoading(false);
    }
  };

  const selectEpisode = (episode: any) => {
    setEpisodeData(episode);
    setActiveEpisode(episode.id, episode.patient_id);
    if (episode.patients?.phone) {
      setPhoneNumber(episode.patients.phone);
    } else {
      setPhoneNumber('');
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!paymentMethod || !episodeData) return;
    const amount = Number(customAmount) || 1000;
    try {
      if (paymentMethod === 'cash') {
        setLoading(true);
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: episodeData.id,
            amount,
            method: 'cash',
            cashReceived: true,
            type: 'consultation',
            description: `Cash received for consultation ${episodeData.episode_code}`,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.payment?.status !== 'completed') {
          throw new Error(data.error || 'Cash payment could not be recorded as received.');
        }
        setReceiptNumber(data.payment.receipt_number || '');
        setStep('paid');
        return;
      }

      if (paymentMethod !== 'mobile') {
        throw new Error('Card payments are not enabled at this cashier. Use the configured card payment flow.');
      }
      if (!phoneNumber.trim()) throw new Error('Enter the patient mobile-money number before continuing.');

      setStep('checking');
      setPollAttempt(1);
      setCheckingMessage('Prompting the patient phone and waiting for the mobile-money provider to confirm settlement...');
      const initiation = await fetch('/api/payments/collectug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episodeData.id, amount, phoneNumber: phoneNumber.trim() }),
      });
      const initiationData = await initiation.json();
      if (!initiation.ok || !initiationData.success) {
        throw new Error(initiationData.error || 'Payment request could not be initiated. No payment was recorded as received.');
      }

      const txnId: string | null = initiationData.data?.transaction?.transaction_id || null;
      const merchantReference: string | null = initiationData.merchantReference || null;
      if (!txnId && !merchantReference) {
        throw new Error('The provider did not return a transaction reference. Payment remains unconfirmed; do not direct the patient to consultation.');
      }

      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = setInterval(async () => {
        attempts++;
        setPollAttempt(attempts);
        setCheckingMessage(`Verifying settlement directly with CollectUG (attempt ${attempts})...`);

        try {
          const verifyUrl = txnId
            ? `/api/payments/verify?transaction_id=${encodeURIComponent(txnId)}`
            : `/api/payments/verify?merchant_reference=${encodeURIComponent(merchantReference!)}`;
          const verifyResponse = await fetch(verifyUrl);
          const verification = await verifyResponse.json();
          if (verifyResponse.ok && verification.status === 'completed') {
            clearInterval(pollInterval);
            setReceiptNumber(verification.receiptNumber || '');
            setStep('paid');
            return;
          }
          if (verification.status === 'failed' || verification.status === 'cancelled') {
            clearInterval(pollInterval);
            setCheckingMessage('The provider reports that this payment failed. The episode remains unpaid. You may return and retry.');
            return;
          }
        } catch {
          setCheckingMessage('Provider verification is temporarily unavailable. This payment remains pending.');
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setCheckingMessage('No settlement confirmation received. This payment remains pending; do not mark it as paid. Check the provider transaction before retrying.');
        }
      }, 2000);
    } catch (err) {
      setCheckingMessage(err instanceof Error ? err.message : 'Payment could not be verified. It remains unpaid.');
      if (paymentMethod === 'cash') setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setEpisodeData(null);
    setPaymentMethod('mobile');
    setPhoneNumber('');
    setActiveEpisode(null);
    setCustomAmount('1000');
    setPollAttempt(1);
    setReceiptNumber('');
  };

  return (
    <>
    <div>
      <Breadcrumbs items={[{ label: 'Cashier & Billing Desk' }]} />

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">Billing &amp; Payment Settlement</h1>
          <p className="page-header-subtitle">
            Process healthcare service payments securely and promote patient episodes to active clinical queues.
          </p>
        </div>

      {step === 'search' && (
        <div className="glass-card p-10 max-w-2xl mx-auto shadow-2xl">
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Search className="w-4 h-4" /> Locate Medical Episode
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Episode Code (e.g. EP-XXXX) or Patient Name..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  required 
                  className="input-modern pl-12 text-lg py-5 border-2 group-hover:border-amber-400 transition-colors"
                />
                <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
            <button type="submit" className="w-full btn btn-primary py-5 mt-6 font-bold shadow-xl flex items-center justify-center gap-3" disabled={loading}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
              {loading ? 'Searching National DB...' : 'Search Episodes'}
            </button>
          </form>
        </div>
      )}

      {step === 'results' && (
        <div className="glass-card p-10 max-w-3xl mx-auto fade-in">
          <div className="flex justify-between items-center mb-8">
            <h3 className="m-0">Search Results</h3>
            <button onClick={reset} className="btn bg-gray-100 text-gray-700">Change Search</button>
          </div>
          <div className="space-y-4">
            {searchResults.map((ep, i) => (
              <div 
                key={i} 
                onClick={() => selectEpisode(ep)}
                className="p-6 bg-white/50 border border-border-color rounded-2xl flex justify-between items-center cursor-pointer hover:border-amber-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <User className="text-amber-600" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{ep.patients.first_name} {ep.patients.last_name}</div>
                    <div className="text-xs text-muted font-mono">{ep.episode_code} • {new Date(ep.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className={`badge-modern ${ep.status === 'created' ? 'badge-primary' : 'badge-secondary'}`}>
                    {ep.status.replace('_', ' ')}
                   </div>
                   <ArrowRight className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'payment' && episodeData && (
        <div className="glass-card p-10 max-w-2xl mx-auto fade-in shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Receipt className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Episode Settlement</h2>
              <p className="text-muted font-mono">{episodeData.episode_code} • {episodeData.patients.first_name} {episodeData.patients.last_name}</p>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-3xl p-8 mb-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            
            <div className="form-group mb-6">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-xs block mb-3">Amount (UGX)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-2xl"
                min="0"
                step="1"
              />
            </div>

            <div className="border-t border-white/10 my-6"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-amber-400 uppercase tracking-wider">Total Due</span>
              <span className="text-4xl font-black text-amber-400">UGX {Number(customAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="form-group mb-10">
            <label className="form-label text-center mb-6">Select Payment Method</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PaymentOption 
                icon={<Smartphone />} 
                label="Mobile Money" 
                active={paymentMethod === 'mobile'} 
                onClick={() => setPaymentMethod('mobile')} 
              />
              <PaymentOption 
                icon={<Banknote />} 
                label="Cash" 
                active={paymentMethod === 'cash'} 
                onClick={() => setPaymentMethod('cash')} 
              />
              <PaymentOption 
                icon={<CreditCard />} 
                label="Card (Unavailable)" 
                active={false}
                disabled
              />
            </div>
          </div>

          {paymentMethod === 'mobile' && (
            <div className="form-group mb-8">
              <label className="form-label flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-500" /> Patient Mobile Money Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0771234567 or 0701234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input-modern text-lg"
              />
              <p className="text-xs text-muted mt-1.5">
                A payment prompt will be initiated. The system will continuously check until transaction confirmation.
              </p>
            </div>
          )}

          <button 
            className="w-full btn btn-primary py-5 text-xl font-black flex items-center justify-center gap-3 shadow-2xl hover:shadow-glass" 
            onClick={handlePayment} 
            disabled={!paymentMethod || loading || !customAmount || Number(customAmount) <= 0}
          >
            <ShieldCheck className="w-6 h-6" />
            {paymentMethod === 'mobile' ? 'Request & Verify Mobile Payment' : paymentMethod === 'cash' ? 'Confirm Cash Received' : 'Card Payment Unavailable'}
          </button>
        </div>
      )}

      {step === 'checking' && episodeData && (
        <div className="glass-card p-12 max-w-2xl mx-auto text-center fade-in shadow-2xl border-amber-300">
          <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
            <div className="w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-400 flex items-center justify-center shadow-lg">
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Checking Transaction • Attempt #{pollAttempt}
          </div>

          <h2 className="text-2xl font-black mb-2">Checking Transaction Status</h2>
          <p className="text-base text-muted max-w-md mx-auto mb-8 font-medium">
            {checkingMessage}
          </p>

          <div className="p-5 bg-white/80 rounded-2xl border border-border-color text-left mb-8 max-w-md mx-auto space-y-2 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-muted">Episode:</span>
              <span className="font-mono font-bold text-gray-900">{episodeData.episode_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Patient:</span>
              <span className="font-bold text-gray-900">{episodeData.patients?.first_name} {episodeData.patients?.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Amount:</span>
              <span className="font-bold text-amber-600">UGX {Number(customAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Method:</span>
              <span className="font-bold capitalize text-gray-900">{paymentMethod === 'mobile' ? 'Mobile Money' : paymentMethod}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setStep('payment')}
              className="btn bg-gray-100 text-gray-700 py-3 px-6 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'paid' && episodeData && (
        <div className="glass-card p-12 max-w-2xl mx-auto text-center fade-in shadow-2xl border-emerald-300">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-emerald-600" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
            Payment Verified &amp; Confirmed
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {episodeData.patients?.first_name} {episodeData.patients?.last_name} Has Paid
          </h1>

          <p className="text-lg text-muted mb-8">
            Settlement of <span className="font-black text-emerald-600">UGX {Number(customAmount || 0).toLocaleString()}</span> successfully verified
            {receiptNumber ? <> • Receipt: <span className="font-mono font-bold text-gray-800">{receiptNumber}</span></> : null}.
          </p>
          
          {/* Confirms to go to doctor */}
          <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-400 rounded-3xl text-emerald-900 mb-8 text-left flex items-start gap-5 shadow-sm">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-950 mb-1">
                Confirmed: Direct Patient to Doctor
              </h3>
              <p className="text-sm text-emerald-900/90 leading-relaxed font-medium">
                Payment is recorded. Episode <span className="font-mono font-black">{episodeData.episode_code}</span> is now marked as <strong>In Consultation</strong>.
                Please confirm to <strong>{episodeData.patients?.first_name} {episodeData.patients?.last_name}</strong> that they can proceed to the <strong>Doctor's Consultation Room</strong>.
              </p>
            </div>
          </div>

          {/* Next Patient Button */}
          <button 
            onClick={reset} 
            className="w-full btn btn-primary py-5 text-xl font-black shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <span>Next Patient</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}
      </div>
    </div> 
    </>
  );
}

function PaymentOption({ icon, label, active, onClick, disabled = false }: any) {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
        active 
          ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-lg scale-105' 
          : 'border-gray-100 bg-white hover:border-amber-200 text-gray-400'
      }`}
    >
      <div className={`${active ? 'text-amber-500' : 'text-gray-300'}`}>{icon}</div>
      <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
    </div>
  );
}

