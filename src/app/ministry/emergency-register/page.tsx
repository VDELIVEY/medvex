'use client';

import React, { useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { useApp } from '@/lib/context';
import { 
  User, Calendar, Activity, ShieldAlert, 
  Loader2, AlertCircle, CheckCircle2, HeartPulse,
  Phone, Mail
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function EmergencyRegisterPage() {
  return (
    <RoleGuard allowedRole={['ministry', 'superadmin', 'receptionist', 'admin']}>
      <EmergencyRegisterContent />
    </RoleGuard>
  );
}

function EmergencyRegisterContent() {
  const { institutionId } = useApp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    bloodType: 'Unknown',
    phone: '',
    email: '',
    emergencyNote: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessData(null);

    try {
      const res = await fetch('/api/citizens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          conditions: formData.emergencyNote,
          history: null,
          allergies: null,
          securityPin: '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Emergency registration failed');
      }

      setSuccessData(data.patient);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      bloodType: 'Unknown',
      phone: '',
      email: '',
      emergencyNote: '',
    });
    setError('');
    setSuccessData(null);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Emergency Registration' }]} backHref="/" backLabel="Home" />

      <div className="container max-w-3xl p-8 fade-in">
        {/* Hero Header */}
        <div className="page-header-banner no-print">
          <h1 className="page-header-title">Emergency Patient Registration</h1>
          <p className="page-header-subtitle">
            Rapid enrollment for urgent intake. Minimum required fields only. Full medical profile can be completed later.
          </p>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-8 no-print">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-lg">Registration Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!successData ? (
          <form onSubmit={handleSubmit} className="glass-card mb-12">
            <div className="mb-8 pb-8 border-b border-border-color">
              <h3 className="flex items-center gap-2 mb-6 text-danger">
                <ShieldAlert className="w-5 h-5" /> Emergency Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      required
                      className="input-modern pl-12"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      required
                      className="input-modern pl-12"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="date"
                      required
                      className="input-modern pl-12"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    required
                    className="select-modern"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    disabled={loading}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Type</label>
                  <select
                    className="select-modern"
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    disabled={loading}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-border-color">
              <h3 className="flex items-center gap-2 mb-6 text-primary">
                <Phone className="w-5 h-5" /> Contact Information (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="tel"
                      className="input-modern pl-12"
                      placeholder="+256 700 000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="email"
                      className="input-modern pl-12"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="flex items-center gap-2 mb-6 text-danger">
                <HeartPulse className="w-5 h-5" /> Emergency Notes
              </h3>
              <div className="form-group">
                <label className="form-label">Urgent Medical Alert / Chief Complaint</label>
                <textarea
                  rows={3}
                  className="textarea-modern resize-vertical"
                  placeholder="Describe the emergency condition, symptoms, or urgent medical needs..."
                  value={formData.emergencyNote}
                  onChange={(e) => setFormData({ ...formData, emergencyNote: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn btn-primary text-lg py-4 shadow-xl hover:shadow-glass"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Registering Emergency Patient...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-3" />
                  Register & Generate Emergency ID
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="fade-in">
            <div className="alert-modern alert-success mb-8 no-print">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-lg">Emergency Registration Complete!</p>
                <p className="text-sm mt-1">
                  Patient enrolled with emergency ID. Full medical profile can be updated later.
                </p>
              </div>
            </div>

            <div className="glass-card p-8 mb-8">
              <h3 className="text-xl font-black mb-6">Emergency ID Card</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-muted uppercase mb-1">Name</div>
                  <div className="font-bold">{successData.first_name} {successData.last_name}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted uppercase mb-1">Date of Birth</div>
                  <div className="font-bold">{successData.dob || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted uppercase mb-1">Gender</div>
                  <div className="font-bold">{successData.gender || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted uppercase mb-1">Blood Type</div>
                  <div className="font-bold">{successData.blood_type || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-bold text-muted uppercase mb-1">Registry ID</div>
                  <div className="font-mono font-bold text-primary">{successData.qr_code}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
              <button className="btn btn-secondary px-10 py-3 text-lg" onClick={resetForm}>
                Register Another Emergency
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
