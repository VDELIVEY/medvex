"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck, QrCode, Search, Loader2, AlertCircle,
  HeartPulse, ClipboardList, Pill, Beaker, User,
  Droplet, Activity, ChevronDown, ChevronUp, Calendar,
  CheckCircle2, ArrowLeft, Camera, X,
} from "lucide-react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────
interface Citizen {
  id: string;
  qr_code: string;
  first_name: string;
  last_name: string;
  dob?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  underlying_conditions?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
}

interface Episode {
  id: string;
  episode_code: string;
  status?: string;
  created_at?: string;
  institutions?: { name: string } | null;
}

interface EpisodeDetail {
  episodeId: string;
  diagnoses: { notes: string; created_at: string }[];
  prescriptions: { medication: string; dosage: string; instructions?: string; dispensed: boolean }[];
  tests: { test_type: string; results?: string; created_at: string }[];
}

// ── Main page — no auth required ─────────────────────────────────────────────
export default function MyHealthPage() {
  const [step, setStep] = useState<"lookup" | "result">("lookup");
  const [qrInput, setQrInput] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeDetails, setEpisodeDetails] = useState<Record<string, EpisodeDetail>>({});

  // QR scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);

  // Accordion state per episode
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim() || pin.length < 4) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/my-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: qrInput.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to retrieve health records.");
        return;
      }
      setCitizen(data.citizen);
      setEpisodes(data.episodes || []);
      setEpisodeDetails(data.episodeDetails || {});
      setStep("result");
      stopScanner();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── QR scanner via html5-qrcode ────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setScannerActive(true);
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScannerActive(false);
  }, []);

  useEffect(() => {
    if (!scannerActive) return;
    let mounted = true;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!mounted || !document.getElementById("qr-reader-patient")) return;
      const scanner = new Html5QrcodeScanner(
        "qr-reader-patient",
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decoded: string) => {
          setQrInput(decoded);
          stopScanner();
        },
        () => {}
      );
    });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, [scannerActive, stopScanner]);

  const reset = () => {
    setStep("lookup");
    setQrInput("");
    setPin("");
    setError("");
    setCitizen(null);
    setEpisodes([]);
    setEpisodeDetails({});
    setExpanded({});
    stopScanner();
  };

  const toggleEpisode = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── LOOKUP STEP ────────────────────────────────────────────────────────────
  if (step === "lookup") {
    return (
      <div className="fade-in" style={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(8,127,121,0.06) 0%, rgba(228,139,57,0.04) 100%)" }}>
        {/* Back to home */}
        <div className="container" style={{ paddingTop: "1.5rem" }}>
          <Link
            href="/"
            className="flex items-center gap-2 text-muted"
            style={{ fontSize: 14, fontWeight: 700, textDecoration: "none", width: "fit-content" }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <div className="container max-w-2xl mx-auto p-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: "var(--primary-gradient)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.25rem",
                boxShadow: "0 12px 32px rgba(8,127,121,0.3)",
              }}
            >
              <HeartPulse size={36} color="white" />
            </div>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "0.5rem" }}>
              My Health Records
            </h1>
            <p className="text-muted" style={{ fontSize: "1.05rem", maxWidth: 480, margin: "0 auto" }}>
              Access your personal medical history, episode records, prescriptions, and lab results — securely from anywhere.
            </p>
          </div>

          {/* Form card */}
          <div className="glass-card p-8 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ background: "var(--primary-gradient)" }} />

            {error && (
              <div className="alert-modern alert-error mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* QR Code field */}
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  Your Health Card QR Code
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    className="input-modern pl-12 pr-14"
                    placeholder="e.g. PAT-XXXXXXXXXX"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                  {/* Scan button inside input */}
                  <button
                    type="button"
                    onClick={scannerActive ? stopScanner : startScanner}
                    disabled={loading}
                    title="Scan QR code with camera"
                    style={{
                      position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                      background: scannerActive ? "rgba(239,68,68,0.1)" : "rgba(8,127,121,0.1)",
                      border: "none", borderRadius: 10, padding: "6px 8px",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      color: scannerActive ? "#ef4444" : "var(--primary)",
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {scannerActive ? <X size={15} /> : <Camera size={15} />}
                    {scannerActive ? "Stop" : "Scan"}
                  </button>
                </div>
                <p className="text-muted mt-2" style={{ fontSize: 12 }}>
                  The QR code value is printed on your National Health Identity Card. Click "Scan" to use your camera.
                </p>
              </div>

              {/* Inline QR scanner */}
              {scannerActive && (
                <div
                  className="fade-in"
                  style={{
                    borderRadius: 20, overflow: "hidden",
                    border: "2px solid var(--primary)", background: "#0f172a",
                  }}
                >
                  <div id="qr-reader-patient" style={{ width: "100%" }} />
                </div>
              )}

              {/* PIN field */}
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Security PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="input-modern"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  disabled={loading}
                  style={{ fontSize: "1.5rem", letterSpacing: "0.5em", textAlign: "center", fontFamily: "monospace" }}
                />
                <p className="text-muted mt-2" style={{ fontSize: 12 }}>
                  This is the 4-digit PIN set when you were registered. It is never shared with anyone.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-4 text-lg font-black flex items-center justify-center gap-3 shadow-2xl"
                disabled={loading || !qrInput.trim() || pin.length < 4}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <HeartPulse className="w-5 h-5" />}
                {loading ? "Verifying..." : "View My Health Records"}
              </button>
            </form>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-border-color flex flex-wrap justify-center gap-6 text-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary" /> PIN-protected access</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary" /> No account required</span>
              <span className="flex items-center gap-1.5"><Activity size={14} className="text-primary" /> Ministry of Health verified</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT STEP ────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(8,127,121,0.06) 0%, rgba(228,139,57,0.04) 100%)", paddingBottom: "4rem" }}>
      {/* Top bar */}
      <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-muted btn"
            style={{ fontSize: 14, fontWeight: 700, background: "rgba(255,255,255,0.6)" }}
          >
            <ArrowLeft size={16} />
            Back / New Lookup
          </button>
          <div className="badge-modern badge-primary flex items-center gap-2">
            <ShieldCheck size={13} />
            PIN Verified — Secure Session
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto p-8 space-y-8">

        {/* Citizen identity card */}
        <div className="glass-card p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: "var(--primary-gradient)" }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black" style={{ margin: 0 }}>
                    {citizen?.first_name} {citizen?.last_name}
                  </h2>
                  <p className="text-muted font-mono text-sm mt-1">{citizen?.qr_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <InfoChip icon={<Calendar size={14} />} label="Date of Birth" value={citizen?.dob ? new Date(citizen.dob).toLocaleDateString() : "—"} />
                <InfoChip icon={<User size={14} />} label="Gender" value={citizen?.gender ?? "—"} />
                <InfoChip icon={<Droplet size={14} />} label="Blood Type" value={citizen?.blood_type ?? "—"} color="text-red-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField title="Underlying Conditions" value={citizen?.underlying_conditions} />
                <ProfileField title="Medical History" value={citizen?.medical_history} />
                <div className="md:col-span-2">
                  <ProfileField title="Allergies" value={citizen?.allergies} />
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-4 rounded-2xl border border-border-color shadow-sm">
                {citizen?.qr_code && <QRCodeSVG value={citizen.qr_code} size={140} level="M" includeMargin />}
              </div>
              <p className="text-muted text-center" style={{ fontSize: 11, fontWeight: 700 }}>
                Show this at any registered facility
              </p>
            </div>
          </div>
        </div>

        {/* Episodes section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="text-primary" />
            <h3 style={{ margin: 0 }}>Clinical Episodes &amp; Visit History</h3>
            <span className="badge-modern badge-primary">{episodes.length} records</span>
          </div>

          {episodes.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-gray-200">
              <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h4 className="text-gray-400">No Episodes Yet</h4>
              <p className="text-muted">No hospital visits recorded for your account yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.map((ep) => {
                const detail = episodeDetails[ep.id] || { diagnoses: [], prescriptions: [], tests: [] };
                const isOpen = expanded[ep.id];
                const institutionName = (ep.institutions as any)?.name || "Healthcare Facility";
                return (
                  <div key={ep.id} className="glass-card overflow-hidden">
                    {/* Episode header — always visible */}
                    <button
                      onClick={() => toggleEpisode(ep.id)}
                      className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-white/30 transition-colors"
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-black text-xl" style={{ color: "var(--primary)" }}>{ep.episode_code}</div>
                          <div className="text-muted text-sm mt-0.5">
                            {institutionName}
                            {ep.created_at ? ` · ${new Date(ep.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <EpisodeStatusBadge status={ep.status} />
                        {isOpen ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
                      </div>
                    </button>

                    {/* Episode body — expanded */}
                    {isOpen && (
                      <div className="px-6 pb-6 border-t border-border-color fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                          {/* Diagnoses */}
                          <div className="card-basic p-5 rounded-2xl">
                            <h5 className="flex items-center gap-2 mb-3" style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>
                              <ClipboardList size={14} /> Diagnosis Notes
                            </h5>
                            {detail.diagnoses.length === 0 ? (
                              <p className="text-muted" style={{ fontSize: 13 }}>No notes recorded.</p>
                            ) : (
                              <div className="space-y-2">
                                {detail.diagnoses.map((d, i) => (
                                  <div key={i} className="bg-white p-3 rounded-xl border border-border-color">
                                    <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: "pre-wrap" }}>{d.notes || "—"}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Prescriptions */}
                          <div className="card-basic p-5 rounded-2xl">
                            <h5 className="flex items-center gap-2 mb-3" style={{ fontSize: 13, fontWeight: 900, color: "#e88b39" }}>
                              <Pill size={14} /> Prescriptions
                            </h5>
                            {detail.prescriptions.length === 0 ? (
                              <p className="text-muted" style={{ fontSize: 13 }}>No prescriptions.</p>
                            ) : (
                              <div className="space-y-2">
                                {detail.prescriptions.map((p, i) => (
                                  <div key={i} className="bg-white p-3 rounded-xl border border-border-color">
                                    <div className="font-black" style={{ fontSize: 14 }}>{p.medication}</div>
                                    <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                                      Dosage: <strong>{p.dosage || "—"}</strong>
                                    </div>
                                    {p.instructions && <div style={{ fontSize: 12, marginTop: 4, color: "var(--text-muted)" }}>{p.instructions}</div>}
                                    <div className="mt-2">
                                      {p.dispensed
                                        ? <span className="badge-modern badge-success" style={{ fontSize: 10 }}><CheckCircle2 size={10} /> Dispensed</span>
                                        : <span className="badge-modern badge-primary" style={{ fontSize: 10 }}>Pending</span>
                                      }
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Lab Tests */}
                          <div className="card-basic p-5 rounded-2xl">
                            <h5 className="flex items-center gap-2 mb-3" style={{ fontSize: 13, fontWeight: 900, color: "#6366f1" }}>
                              <Beaker size={14} /> Lab Results
                            </h5>
                            {detail.tests.length === 0 ? (
                              <p className="text-muted" style={{ fontSize: 13 }}>No lab tests.</p>
                            ) : (
                              <div className="space-y-2">
                                {detail.tests.map((t, i) => (
                                  <div key={i} className="bg-white p-3 rounded-xl border border-border-color">
                                    <div className="font-black" style={{ fontSize: 13 }}>{t.test_type}</div>
                                    {t.results
                                      ? <div style={{ fontSize: 12, marginTop: 4, whiteSpace: "pre-wrap" }}>{t.results}</div>
                                      : <span className="text-muted" style={{ fontSize: 12 }}>Awaiting results</span>
                                    }
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center text-muted" style={{ fontSize: 12 }}>
          <ShieldCheck size={14} className="inline mr-1 text-primary" />
          Your records are encrypted and PIN-protected. This session does not store any cookies.
        </div>
      </div>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────
function InfoChip({ icon, label, value, color = "text-gray-800" }: any) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-border-color">
      <div className="text-muted flex items-center gap-1 mb-1" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        {icon} {label}
      </div>
      <div className={`font-black ${color}`} style={{ fontSize: 15 }}>{value}</div>
    </div>
  );
}

function ProfileField({ title, value }: { title: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="bg-red-50/40 rounded-2xl p-4 border border-red-100">
      <div className="text-muted" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

function EpisodeStatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    completed: "badge-success",
    cancelled: "bg-red-100 text-red-700",
    in_consultation: "badge-primary",
    prescription_ready: "bg-orange-100 text-orange-700",
    waiting_lab: "bg-purple-100 text-purple-700",
    lab_results_ready: "bg-indigo-100 text-indigo-700",
    created: "bg-gray-100 text-gray-600",
  };
  const cls = map[status || ""] || "badge-primary";
  return (
    <span className={`badge-modern ${cls} capitalize`} style={{ fontSize: 10 }}>
      {status?.replace(/_/g, " ") || "active"}
    </span>
  );
}
