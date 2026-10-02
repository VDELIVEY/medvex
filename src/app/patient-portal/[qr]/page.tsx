"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Scan,
  Stethoscope,
  ShieldCheck,
  BellRing,
} from "lucide-react";
import { useApp, type UserRole } from "@/lib/context";
import Breadcrumbs from "@/components/Breadcrumbs";

type Citizen = {
  id: string;
  qr_code: string;
  first_name: string;
  last_name: string;
  age?: number | null;
  gender?: string | null;
  blood_type?: string | null;
  underlying_conditions?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  phone?: string | null;
  email?: string | null;
  dob?: string | null;
};

type Episode = {
  id: string;
  episode_code: string;
  status?: string;
  created_at?: string;
};

type EpisodeDetails = {
  diagnoses: any[];
  prescriptions: any[];
};

const ALL_STAFF_ROLES: UserRole[] = ['ministry', 'superadmin', 'admin', 'doctor', 'receptionist', 'cashier', 'lab', 'pharmacy'];

export default function PatientPortalCitizenPage() {
  // Keeping this consistent with the rest of the app auth model.
  // If you later want totally public patient access, we can remove RoleGuard.
  return (
    <RoleGuard allowedRole={ALL_STAFF_ROLES}>
      <PatientPortalCitizen />
    </RoleGuard>
  );
}

function PatientPortalCitizen() {
  const params = useParams<{ qr: string }>();
  const router = useRouter();
  const { role } = useApp();

  const qr = useMemo(() => {
    const raw = params?.qr;
    return raw ? decodeURIComponent(raw) : "";
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeDetails, setEpisodeDetails] = useState<Record<string, EpisodeDetails>>({});
  const [showPinModal, setShowPinModal] = useState(true);
  const [pin, setPin] = useState("");
  const [scanAlertSent, setScanAlertSent] = useState(false);

  const confirmPinAndAccess = async () => {
    if (!pin || pin.length < 4) {
      setError("Please enter a valid 4-digit Security PIN");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const accessRes = await fetch('/api/patient-portal/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr, pin }),
      });
      const accessJson = await accessRes.json();
      if (!accessRes.ok) throw new Error(accessJson?.error || 'PIN verification failed');

      const patientEpisodes = accessJson.episodes || [];
      const details: Record<string, EpisodeDetails> = {};
      for (const episode of patientEpisodes) {
        details[episode.id] = {
          diagnoses: episode.diagnoses || [],
          prescriptions: episode.prescriptions || [],
        };
      }
      setCitizen(accessJson.patient);
      setEpisodes(patientEpisodes);
      setEpisodeDetails(details);
      setScanAlertSent(accessJson.notificationStatus === 'sent');
      setPin('');
      setShowPinModal(false);
    } catch (e: any) {
      setError(e?.message || "PIN verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-8 fade-in">
        <div className="glass-card p-8 card-basic" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Loading Medical History</div>
            <div className="text-muted" style={{ marginTop: 4, fontSize: 14 }}>
              Securely retrieving your records...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && citizen) {
    return (
      <div className="container max-w-4xl mx-auto p-8 fade-in">
        <div className="alert-modern alert-error">
          <AlertCircle className="w-6 h-6 mt-0.5" />
          <div>
            <div className="font-bold" style={{ fontSize: 16 }}>
              Couldn’t open patient portal
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }} className="text-muted">
              {error}
            </div>
            {role && (
              <div style={{ fontSize: 12, marginTop: 6 }} className="text-muted">
                Role: {role}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="container max-w-md mx-auto p-8 fade-in">
        <div className="glass-card p-8 card-basic" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 1rem' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Security Verification</h1>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Enter the patient&apos;s four-digit PIN to authorize access to their record.
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            aria-label="Patient security PIN"
            className="input-modern"
            style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.5em', padding: '0.75rem', fontFamily: 'monospace' }}
            placeholder="••••"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && pin.length === 4 && !loading) void confirmPinAndAccess();
            }}
          />
          {error && (
            <div className="alert-modern alert-error mt-4" role="alert" style={{ fontSize: '0.8rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary flex-1" onClick={() => router.push('/patient-portal/scan')}>
              Cancel
            </button>
            <button className="btn btn-primary flex-1" onClick={confirmPinAndAccess} disabled={pin.length !== 4 || loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {loading ? 'Verifying...' : 'Verify & Access'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Patient Portal Scan', href: '/patient-portal/scan' }, { label: `${citizen.first_name} ${citizen.last_name}` }]}
        backHref="/patient-portal/scan"
        backLabel="Scanner"
      />

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Scan Notification Toast */}
        {scanAlertSent && (
          <div
            className="fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(8,127,121,0.08))',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#047857',
              fontWeight: 700,
              marginBottom: '1.5rem',
            }}
          >
            <BellRing className="w-5 h-5 flex-shrink-0" />
            <div>
              <div>Scan notification sent via SMS & Email to patient</div>
              <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, marginTop: 2 }}>
                The citizen has been alerted that their health pass was accessed.
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 ml-auto" />
          </div>
        )}

        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">{citizen.first_name} {citizen.last_name}</h1>
          <p className="page-header-subtitle">
            Longitudinal Health Profile & Encrypted Episode History &nbsp;·&nbsp; QR: <span className="font-mono">{citizen.qr_code}</span>
          </p>
        </div>

        <div className="glass-card p-6 card-basic">
            <div style={{ fontWeight: 950, fontSize: 22 }}>
              {citizen.first_name} {citizen.last_name}
            </div>

            <div className="text-muted" style={{ marginTop: 4, fontSize: 13 }}>
              QR ID: <span style={{ fontFamily: "monospace" }}>{citizen.qr_code}</span>
            </div>

            <div style={{ marginTop: 10 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniStat label="Date of Birth" value={citizen.dob ? new Date(citizen.dob).toLocaleDateString() : "—"} />
              <MiniStat label="Gender" value={citizen.gender ?? "—"} />
              <MiniStat label="Blood Type" value={citizen.blood_type ?? "—"} />
            </div>

          <div
            className="bg-white p-4 rounded-2xl border border-border-color"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <QRCodeSVG value={citizen.qr_code} size={140} level="M" includeMargin />
          </div>
        </div>

        <div style={{ marginTop: 16 }} className="glass-card p-6 border-blue-100">
          <div className="flex items-start gap-3 mb-3">
            <ClipboardList className="text-primary" />
            <div>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Patient Profile</div>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                Underlying conditions, history and allergies (as stored in the registry).
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField title="Underlying Conditions" value={citizen.underlying_conditions} />
            <TextField title="Medical History" value={citizen.medical_history} />
            <div className="md:col-span-2">
              <TextField title="Allergies" value={citizen.allergies} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 card-basic">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="text-primary" />
          <h2 style={{ margin: 0, fontSize: 22 }}>Clinical Episodes & Medical Record</h2>
        </div>

        {episodes.length === 0 ? (
          <div
            className="text-muted"
            style={{ padding: 18, border: "1px dashed var(--border-color)", borderRadius: 16 }}
          >
            No episodes found for this citizen yet.
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((ep) => {
              const details = episodeDetails[ep.id] || { diagnoses: [], prescriptions: [] };
              return (
                <div key={ep.id} className="glass-card p-6 border-blue-100" style={{ padding: 18 }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div style={{ fontWeight: 950, fontSize: 16 }}>
                        Episode: <span style={{ color: "var(--primary)" }}>{ep.episode_code}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                        Status: {ep.status || "unknown"}
                        {ep.created_at ? ` • ${new Date(ep.created_at).toLocaleDateString()}` : ""}
                      </div>
                    </div>

                    <div className="badge-modern badge-primary" style={{ height: 30 }}>
                      <Scan className="w-4 h-4" />
                      History attached
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card-basic" style={{ padding: 16, borderRadius: 16 }}>
                      <div style={{ fontWeight: 900, marginBottom: 8 }}>Diagnoses & Notes</div>
                      {details.diagnoses.length === 0 ? (
                        <div className="text-muted" style={{ fontSize: 13 }}>
                          No diagnosis notes for this episode.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {details.diagnoses.slice(0, 3).map((d: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white"
                              style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border-color)" }}
                            >
                              <div
                                className="text-muted"
                                style={{ fontSize: 12, fontFamily: "monospace" }}
                              >
                                {d.doctor_id ? `Doctor: ${d.doctor_id}` : "Doctor"}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, whiteSpace: "pre-wrap" }}>
                                {d.notes || "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card-basic" style={{ padding: 16, borderRadius: 16 }}>
                      <div style={{ fontWeight: 900, marginBottom: 8 }}>Prescriptions</div>
                      {details.prescriptions.length === 0 ? (
                        <div className="text-muted" style={{ fontSize: 13 }}>
                          No prescriptions for this episode.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {details.prescriptions.slice(0, 4).map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white"
                              style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border-color)" }}
                            >
                              <div style={{ fontWeight: 950, color: "var(--text-main)" }}>{p.medication}</div>
                              <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                                Dosage: <span style={{ fontWeight: 800 }}>{p.dosage || "—"}</span>
                              </div>
                              {p.instructions ? (
                                <div style={{ marginTop: 6, fontSize: 13, whiteSpace: "pre-wrap" }}>
                                  {p.instructions}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-muted" style={{ fontSize: 12 }}>
          For privacy, detailed diagnosis/lab notes may require institutional authorization.
        </div>
      </div>

      {/* ── 4-Digit Security PIN Modal ─────────────────────────────── */}
      {showPinModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowPinModal(false)}
        >
          <div
            className="glass-card fade-in"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '2rem',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(15,23,42,0.3)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'white',
                boxShadow: '0 8px 20px rgba(8,127,121,0.25)',
              }}
            >
              <ShieldCheck size={28} />
            </div>

            <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Security Verification</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Enter the patient's 4-digit security PIN to access their medical record.
            </p>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              className="input-modern"
              style={{
                textAlign: 'center',
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '0.5em',
                padding: '0.75rem',
                fontFamily: 'monospace',
              }}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(val);
                setError('');
              }}
            />

            {error && (
              <div className="alert-modern alert-error mt-4" style={{ fontSize: '0.8rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={confirmPinAndAccess}
                disabled={pin.length < 4 || loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {loading ? 'Verifying...' : 'Verify & Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div
      className="bg-white"
      style={{ padding: 12, borderRadius: 16, border: "1px solid var(--border-color)" }}
    >
      <div
        className="text-muted"
        style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 900, letterSpacing: 0.5 }}
      >
        {label}
      </div>
      <div style={{ marginTop: 6, fontWeight: 950, fontSize: 14 }}>{value ?? "—"}</div>
    </div>
  );
}

function TextField({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white" style={{ padding: 14, borderRadius: 16, border: "1px solid var(--border-color)" }}>
      <div
        className="text-muted"
        style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 900, letterSpacing: 0.5 }}
      >
        {title}
      </div>
      <div style={{ marginTop: 6, fontWeight: 800, fontSize: 13, whiteSpace: "pre-wrap" }}>{value || "—"}</div>
    </div>
  );
}