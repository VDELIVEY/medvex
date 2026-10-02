"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { useApp, type UserRole } from "@/lib/context";
import { Scan, User, Stethoscope, ClipboardList, AlertCircle, Loader2, Search, ShieldCheck, X, BellRing, CheckCircle2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

// NOTE: This app is designed as a patient portal UI.
// Scanning is supported via manual paste (no camera library in this repo).
// When a QR value is provided, the portal fetches citizen + episode history.

const ALL_STAFF_ROLES: UserRole[] = ['ministry', 'superadmin', 'admin', 'doctor', 'receptionist', 'cashier', 'lab', 'pharmacy'];

export default function PatientPortalScanPage() {
  return (
    <RoleGuard allowedRole={ALL_STAFF_ROLES}>
      <PatientPortalScan />
    </RoleGuard>
  );
}

function PatientPortalScan() {
  const router = useRouter();
  const { role } = useApp();

  const [qrValue, setQrValue] = useState("");
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [scanAlertSent, setScanAlertSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const citizen = useCitizenByQr(qrValue);
  const episodes = useEpisodesByPatientId(citizen?.id);

  const canSubmit = useMemo(() => qrValue.trim().length > 0 && !loading, [qrValue, loading]);

  const initiateScan = async () => {
    setError("");
    const q = qrValue.trim();
    if (!q) {
      setError("Enter or paste the citizen QR code value.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/citizens?qr=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Citizen not found in national registry");
      // Open PIN modal
      setShowPinModal(true);
    } catch (e: any) {
      setError(e?.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmPinAndAccess = async () => {
    if (!pin || pin.length < 4) {
      setError("Please enter a valid 4-digit Security PIN");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const verifyRes = await fetch('/api/patients/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: citizen.id, pin }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyJson?.error || 'PIN verification failed');

      const notifRes = await fetch('/api/scan-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: citizen.id,
          recipientPhone: citizen.phone || null,
          recipientEmail: citizen.email || null,
        }),
      });
      const notifJson = await notifRes.json();

      setScanAlertSent(true);
      setShowPinModal(false);
      setTimeout(() => {
        router.push(`/patient-portal/${encodeURIComponent(qrValue.trim())}`);
      }, 1500);
    } catch (e: any) {
      setError(e?.message || "PIN verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Patient Medical Record Scanner' }]} />

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">Citizen Record Lookup & Digital Health Pass</h1>
          <p className="page-header-subtitle">
            Enter or scan a citizen's MedQR code to securely retrieve their longitudinal medical history and health records.
          </p>
        </div>

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

        <div className="p-4 rounded-2xl bg-white/50 border border-border-color" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Scan className="text-primary" />
          <span style={{ fontWeight: 800, color: "var(--text-main)" }}>Secure Access</span>
        </div>

        {error && (
          <div className="alert-modern alert-error mt-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 mt-0.5" />
            <div>
              <div className="font-bold">{error}</div>
              {role && <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Role: {role}</div>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="form-group">
            <label className="form-label">Citizen QR Code</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                className="input-modern pl-12"
                placeholder="e.g., PAT-XXXXXXXXXX"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="mt-4 text-muted" style={{ fontSize: 12 }}>
              Tip: If you printed the citizen card, the QR under the patient name contains the portal lookup value.
            </div>
          </div>

          <div className="flex flex-col">
            <button
              type="button"
              className="btn btn-primary px-8 py-4 font-bold flex items-center justify-center gap-2"
              onClick={initiateScan}
              disabled={!canSubmit}
              style={{ height: 52, marginTop: 32 }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
              {loading ? "Validating..." : "Open Medical History"}
            </button>

            {qrValue.trim() && citizen && (
              <div className="glass-card p-5 mt-6 border-blue-100" style={{ alignSelf: "stretch" }}>
                <div className="flex items-center gap-3 mb-2">
                  <User className="text-primary" />
                  <div style={{ fontWeight: 800 }}>Citizen Found</div>
                </div>
                <div className="text-muted" style={{ fontSize: 14 }}>
                  {citizen.first_name} {citizen.last_name}
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 6, fontFamily: "monospace" }}>
                  QR ID: {citizen.qr_code}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {citizen && episodes && (
        <div className="glass-card p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="text-primary" />
                <h2 className="text-2xl" style={{ margin: 0 }}>Medical History</h2>
              </div>
              <div className="text-muted" style={{ fontSize: 14 }}>
                Under {citizen.underlying_conditions ? "clinical records" : "patient records"} • Episode count: {episodes?.length || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-border-color" style={{ display: "flex", justifyContent: "center" }}>
              {citizen.qr_code ? <QRCodeSVG value={citizen.qr_code} size={120} level="M" includeMargin /> : null}
            </div>
          </div>

          {episodes.length === 0 ? (
            <div className="text-muted" style={{ padding: 24, border: "1px dashed var(--border-color)", borderRadius: 16 }}>
              No medical episodes found for this citizen yet.
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.map((ep: any) => (
                <div key={ep.id} className="card-basic" style={{ padding: 16, borderRadius: 16, border: "1px solid var(--border-color)" }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        Episode: <span style={{ color: "var(--primary)" }}>{ep.episode_code}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                        Status: {ep.status || "unknown"} • {ep.created_at ? new Date(ep.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="badge-modern badge-primary">View details in clinician portal</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-muted" style={{ fontSize: 12 }}>
            For privacy, detailed diagnosis/lab notes may require institutional authorization.
          </div>
        </div>
      )}

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

function useCitizenByQr(qrValue: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const q = qrValue.trim();
    if (!q) {
      setData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/citizens?qr=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Citizen not found");
        if (!cancelled) setData(json.patient);
      } catch {
        if (!cancelled) setData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  return data;
}

function useEpisodesByPatientId(patientId: string | null) {
  const [episodes, setEpisodes] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) {
      setEpisodes([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/episodes?patientId=${encodeURIComponent(patientId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to fetch episodes");
        if (!cancelled) setEpisodes(json.episodes || []);
      } catch {
        if (!cancelled) setEpisodes([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return episodes;
}