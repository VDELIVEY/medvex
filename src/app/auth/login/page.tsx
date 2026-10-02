'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Stethoscope, Lock, User, AlertCircle, Loader2, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function StaffLoginPage() {
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
      if (!res.ok) throw new Error(data.error || 'Invalid staff credentials');

      const role = data.role === 'superadmin' ? 'ministry' : data.role;
      login(role, data.institutionId, data.staffId, data.name);
      window.location.href = `/${role}`;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Clinical Staff Login' }]} backHref="/" backLabel="Home" />

      <div className="container fade-in" style={{ padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--primary-gradient)',
                color: 'white',
                marginBottom: '1rem',
                boxShadow: '0 8px 20px rgba(8, 127, 121, 0.25)',
              }}
            >
              <Stethoscope size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Clinical Staff Login</h1>
            <p className="text-muted" style={{ fontSize: '0.925rem', marginTop: '0.35rem' }}>
              Secure access for Doctors, Receptionists, Cashiers, Lab & Pharmacy staff
            </p>
          </div>

          {error && (
            <div className="alert-modern alert-error mb-6">
              <AlertCircle size={18} />
              <div style={{ fontSize: '0.875rem' }}>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Staff Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  required
                  className="input-modern pl-12"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. doctor_sarah"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Staff Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="password"
                  required
                  className="input-modern pl-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: '1.25rem', padding: '0.85rem', fontSize: '1rem', gap: '0.5rem' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              <span>{loading ? 'Authenticating...' : 'Sign in to Staff Portal'}</span>
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.75rem' }}>
              Not a staff member? Use the dedicated portals:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <Link
                href="/ministry/login"
                className="btn"
                style={{ padding: '0.6rem', fontSize: '0.8rem', gap: '0.35rem', background: 'rgba(8, 127, 121, 0.08)', color: 'var(--primary-dark)' }}
              >
                <ShieldCheck size={14} />
                Ministry Portal
              </Link>
              <Link
                href="/institution/login"
                className="btn"
                style={{ padding: '0.6rem', fontSize: '0.8rem', gap: '0.35rem', background: 'rgba(59, 130, 246, 0.08)', color: '#2563eb' }}
              >
                <Building2 size={14} />
                Facility Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}