import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  QrCode,
  Building2,
  Stethoscope,
  ArrowRight,
  Activity,
  Lock,
  FileCheck2,
  Users,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <main className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HERO SECTION */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(8, 127, 121, 0.08) 0%, rgba(228, 139, 57, 0.05) 100%)',
          borderBottom: '1px solid var(--border-color)',
          padding: 'clamp(3rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(8, 127, 121, 0.12)',
                  color: 'var(--primary-dark)',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                }}
              >
                <Activity size={15} />
                <span>Ministry of Health Connected Platform</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  marginBottom: '1.25rem',
                  color: 'var(--text-main)',
                }}
              >
                Unified Health Identity & <span style={{ color: 'var(--primary)' }}>QR Clinical Records</span>
              </h1>

              <p
                style={{
                  fontSize: '1.15rem',
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                  marginBottom: '2rem',
                  maxWidth: '560px',
                }}
              >
                MedQR seamlessly connects citizens, clinical care providers, registered institutions, and national health logistics through one encrypted, instant-scan digital health record system.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/login"
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', gap: '0.5rem' }}
                >
                  <span>Access Staff Portal</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/my-health"
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, rgba(8,127,121,0.12), rgba(228,139,57,0.08))',
                    color: 'var(--primary-dark)',
                    border: '2px solid var(--primary)',
                    padding: '0.85rem 1.75rem',
                    fontSize: '1rem',
                    gap: '0.5rem',
                    fontWeight: 800,
                  }}
                >
                  <QrCode size={18} />
                  <span>View My Health Records</span>
                </Link>

                <Link
                  href="/chat"
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))',
                    color: '#6d28d9',
                    border: '2px solid #8b5cf6',
                    padding: '0.85rem 1.75rem',
                    fontSize: '1rem',
                    gap: '0.5rem',
                    fontWeight: 800,
                  }}
                >
                  <Sparkles size={18} />
                  <span>Ask MedAI</span>
                </Link>
              </div>
            </div>

            {/* HERO CARD / PREVIEW */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px' }}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-color">
                <div className="flex items-center gap-4">
                  <div className="nav-brand-mark" style={{ width: 56, height: 56, borderRadius: 14 }}>
                    <Image src="/logo.png" alt="MedQR Logo" width={56} height={56} priority />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>National Health Pass</div>
                    <div className="text-muted" style={{ fontSize: '0.9rem' }}>Verifiable Digital Health Record</div>
                  </div>
                </div>
                <div className="badge-modern badge-primary">
                  <Activity size={12} />
                  <span>Verified</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between text-muted" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <span>Clinical Access Point</span>
                    <span style={{ color: 'var(--primary-dark)' }}>Live Sync</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>Instant Episode Creation & QR Patient Lookup</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div style={{ background: 'var(--surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>COLLECTUG BILLING</div>
                    <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.2rem' }}>Automated Confirmation</div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>ENCRYPTION</div>
                    <div style={{ color: 'var(--primary-dark)', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.2rem' }}>HL7 / HMAC-SHA256</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} className="text-primary" />
                <span>Zero paper handoffs. Immediate diagnosis & prescription trace.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PORTALS OVERVIEW */}
      <section className="container" style={{ paddingTop: '4rem', paddingBottom: '2rem' }}>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Integrated Roles & Workspaces
          </h2>
          <p className="text-muted" style={{ fontSize: '1.05rem' }}>
            Select your department or portal entrance to access role-specific clinical workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* CARD 1: MINISTRY */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(8, 127, 121, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Building2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Ministry Control Center
            </h3>
            <p className="text-muted" style={{ fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              National healthcare governance, logistics analytics, citizen registration, and facility oversight.
            </p>

            <Link
              href="/auth/login"
              className="flex items-center gap-2"
              style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
            >
              <span>Ministry Login</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* CARD 2: INSTITUTION ADMIN */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(228, 139, 57, 0.12)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Users size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Institution Portal
            </h3>
            <p className="text-muted" style={{ fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Manage hospital staff credentials, department allocations, and facility-level operational metrics.
            </p>

            <Link
              href="/auth/login"
              className="flex items-center gap-2"
              style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
            >
              <span>Institution Login</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* CARD 3: CLINICAL WORKSPACES */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Stethoscope size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Clinical Workspaces
            </h3>
            <p className="text-muted" style={{ fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Role-tailored interfaces for Doctors, Nurses, Cashiers, Pharmacy, and Lab Technicians.
            </p>

            <Link
              href="/auth/login"
              className="flex items-center gap-2"
              style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
            >
              <span>Staff Portal Login</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* CARD 4: PATIENT SELF-SERVICE */}
          <div
            className="glass-card"
            style={{
              padding: '1.75rem',
              background: 'linear-gradient(135deg, rgba(8,127,121,0.08) 0%, rgba(228,139,57,0.05) 100%)',
              border: '2px solid var(--primary)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--primary-gradient)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 6px 16px rgba(8,127,121,0.3)',
              }}
            >
              <QrCode size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Patient Portal
            </h3>
            <p className="text-muted" style={{ fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Access your own health records, visit history, prescriptions, and lab results — from anywhere, anytime.
            </p>

            <Link
              href="/my-health"
              className="flex items-center gap-2"
              style={{ color: 'var(--primary-dark)', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none' }}
            >
              <span>View My Records</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* CARD 5: AI ASSISTANT */}
          <div
            className="glass-card"
            style={{
              padding: '1.75rem',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(109,40,217,0.05) 100%)',
              border: '2px solid #8b5cf6',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 6px 16px rgba(109,40,217,0.3)',
              }}
            >
              <Sparkles size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              MedAI Assistant
            </h3>
            <p className="text-muted" style={{ fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Ask health questions, understand clinical terms, and get guided wellness advice — powered by Gemini AI.
            </p>

            <Link
              href="/chat"
              className="flex items-center gap-2"
              style={{ color: '#6d28d9', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none' }}
            >
              <span>Open MedAI Chat</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE & TRUST METRICS */}
      <section className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #092623 0%, #054f4b 100%)',
            color: 'white',
            padding: '3rem 2rem',
            borderRadius: '24px',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex justify-center mb-3 text-secondary">
                <FileCheck2 size={32} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>100% Digital</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Instant QR-based Clinical Records
              </div>
            </div>

            <div>
              <div className="flex justify-center mb-3 text-secondary">
                <CreditCard size={32} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>CollectUG</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Billing-ready payment workflows
              </div>
            </div>

            <div>
              <div className="flex justify-center mb-3 text-secondary">
                <Lock size={32} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>HMIS Security</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Role-Based Access & Encrypted Audit Trails
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
