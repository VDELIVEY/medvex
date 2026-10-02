'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function MinistryLoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      if (data.role !== 'ministry' && data.role !== 'superadmin') throw new Error('Not authorized for Ministry Control portal');

      login('ministry', undefined, data.staffId, data.name);
      window.location.href = '/ministry';
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Ministry Control Center Login' }]} />

      <div className="container max-w-xl mx-auto p-8 fade-in">
        <div className="glass-card p-10 shadow-2xl border-emerald-200/40 relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Image src="/logo.png" alt="MedQR Logo" width={40} height={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Ministry Control Center</h1>
            <p className="text-sm text-muted">Ministry of Health National Governance Access</p>
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
                <User className="w-4 h-4 text-teal-600" /> Government Official ID
              </label>
              <input
                type="text"
                required
                className="input-modern"
                placeholder="superadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-600" /> Secure Passcode
              </label>
              <input
                type="password"
                required
                className="input-modern"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 shadow-xl bg-teal-600 hover:bg-teal-700"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
              Authenticate Ministry Credentials
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-color flex justify-between items-center text-xs">
            <Link href="/auth/login" className="text-muted hover:text-gray-900 font-semibold">
              Clinical Staff Login →
            </Link>
            <Link href="/institution/login" className="text-muted hover:text-gray-900 font-semibold">
              Facility Admin Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
