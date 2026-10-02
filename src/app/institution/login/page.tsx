'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function InstitutionLoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [institutionName, setInstitutionName] = useState('');
  const [portalKey, setPortalKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/institutions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: institutionName, portalKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      login('admin', data.institutionId, undefined, data.name);
      window.location.href = '/institution';
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Facility Admin Login' }]} />

      <div className="container max-w-xl mx-auto p-8 fade-in">
        <div className="glass-card p-10 shadow-2xl border-white/50 relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Image src="/logo.png" alt="MedQR Logo" width={40} height={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Facility Administration</h1>
            <p className="text-sm text-muted">Authorized Medical Institution Control Portal</p>
          </div>

          {error && (
            <div className="alert-modern alert-error mb-6 flex items-center gap-3 p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Institution Name
              </label>
              <input
                type="text"
                required
                className="input-modern"
                placeholder="E.g., Mulago National Hospital"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Portal Key
              </label>
              <input
                type="text"
                required
                className="input-modern"
                placeholder="E.g., MULAGO-KEY-2025"
                value={portalKey}
                onChange={(e) => setPortalKey(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 shadow-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Access Facility Portal
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-color flex justify-between items-center text-xs">
            <Link href="/auth/login" className="text-muted hover:text-gray-900 font-semibold">
              Clinical Staff Login →
            </Link>
            <Link href="/ministry/login" className="text-muted hover:text-gray-900 font-semibold">
              Ministry Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
