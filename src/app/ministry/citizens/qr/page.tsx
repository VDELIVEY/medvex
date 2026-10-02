"use client";

import { useMemo, useState, useRef } from "react";
import RoleGuard from "@/components/RoleGuard";
import { QRCodeSVG } from "qrcode.react";
import {
  Search, Loader2, AlertCircle, CheckCircle2,
  Camera, Printer, User, ShieldAlert, Shield, Droplet, Fingerprint,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CitizenQRLookupPage() {
  return (
    <RoleGuard allowedRole={["ministry", "superadmin"]}>
      <CitizenQRLookup />
    </RoleGuard>
  );
}

function CitizenQRLookup() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [patient, setPatient] = useState<any>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const qrValue = useMemo(() => patient?.qr_code || "", [patient]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPatient(null);
    setUploadError("");

    const trimmed = query.trim();
    if (!trimmed) { setError("Enter a citizen name to search."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/citizens?search=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch citizens");
      const match = data.patients?.[0];
      if (!match) { setError("Citizen not found in database."); return; }
      setPatient(match);
    } catch (err: any) {
      setError(err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setUploadError("Image must be smaller than 2MB."); return; }

    setUploading(true);
    setUploadError("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/citizens", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: patient.id, photo_url: base64Data }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to upload photo");
        setPatient((prev: any) => ({ ...prev, photo_url: base64Data }));
      } catch (err: any) {
        setUploadError(err.message || "Failed to update photo");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => { setUploadError("Error reading file."); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="no-print">
        <Breadcrumbs
          items={[{ label: 'Ministry', href: '/ministry' }, { label: 'Citizen QR Directory' }]}
          backHref="/ministry"
          backLabel="Dashboard"
        />
      </div>

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner no-print">
          <h1 className="page-header-title">Citizen QR Directory & Health Pass Generator</h1>
          <p className="page-header-subtitle">
            Search registered citizens to view, update photos, and print standardized MedQR digital identity cards.
          </p>
        </div>

        {/* ── Search Panel ─────────────────────────────────────────── */}
        <div className="glass-card p-8 mb-8 card-basic">

        <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Citizen Name</label>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--text-muted)" }} />
              <input
                type="text"
                className="input-modern"
                style={{ paddingLeft: "3rem" }}
                placeholder="E.g., John Doe"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: "0.75rem", padding: "1rem 2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {loading ? <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> : <Search style={{ width: 20, height: 20 }} />}
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="alert-modern alert-error mt-6" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <AlertCircle style={{ width: 24, height: 24, marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontWeight: 700 }}>{error}</div>
          </div>
        )}
      </div>

      {/* ── Result ────────────────────────────────────────────────── */}
      {patient && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Action Bar (hidden when printing) */}
          <div
            className="no-print"
            style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: "1rem",
              background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
              border: "1px solid var(--border-color)", borderRadius: "var(--radius)",
              padding: "1rem 1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 style={{ width: 22, height: 22, color: "#059669", flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, color: "var(--text-main)" }}>Citizen Found: </span>
                <span style={{ color: "var(--text-muted)" }}>{patient.first_name} {patient.last_name}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: "none" }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                disabled={uploading}
                style={{ padding: "0.55rem 1.2rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {uploading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Camera style={{ width: 16, height: 16 }} />}
                {patient.photo_url ? "Change Photo" : "Upload Photo"}
              </button>

              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ padding: "0.55rem 1.4rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Printer style={{ width: 16, height: 16 }} /> Print Card (2-sided)
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="alert-modern alert-error no-print" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <ShieldAlert style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontWeight: 700 }}>{uploadError}</div>
            </div>
          )}

          {/* ── Preview labels (screen only) ─────────────────────── */}
          <div className="no-print" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>

            {/* FRONT label */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ background: "var(--primary-gradient)", color: "white", fontSize: "10px", fontWeight: 800, padding: "2px 10px", borderRadius: "999px", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Side 1 — Front
                </span>
              </div>

              {/* ── FRONT card (screen preview) ─────────────────────── */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="id-card">
                  <div className="id-card-header">
                    <div className="id-card-header-pattern" />
                    <div className="id-card-logo-row">
                      <div className="id-card-logo-icon"><Shield style={{ width: 20, height: 20, color: "white" }} /></div>
                      <div>
                        <div className="id-card-org">MINISTRY OF HEALTH</div>
                        <div className="id-card-title">National Health Registry</div>
                      </div>
                      <div className="id-card-flag">🏥</div>
                    </div>
                    <div className="id-card-label-band">CITIZEN HEALTH IDENTITY CARD</div>
                  </div>

                  <div className="id-card-body">
                    <div className="id-card-photo-col">
                      <div className="id-card-photo-frame">
                        {patient.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={patient.photo_url} alt="Citizen" className="id-card-photo-img" />
                          : <div className="id-card-photo-placeholder"><User style={{ width: 40, height: 40, color: "#94a3b8" }} /></div>}
                      </div>
                      <div className="id-card-blood-badge">
                        <Droplet style={{ width: 10, height: 10 }} />{patient.blood_type || "—"}
                      </div>
                    </div>

                    <div className="id-card-info-col">
                      <div className="id-card-name">{patient.first_name} {patient.last_name}</div>
                      <div className="id-card-fields">
                        <div className="id-card-field">
                          <div className="id-card-field-label">Gender</div>
                          <div className="id-card-field-value">{patient.gender || "—"}</div>
                        </div>
                        <div className="id-card-field">
                           <div className="id-card-field-label">Date of Birth</div>
                           <div className="id-card-field-value">{patient.dob || "—"}</div>
                         </div>
                        <div className="id-card-field" style={{ gridColumn: "1 / -1" }}>
                          <div className="id-card-field-label">Registry ID</div>
                          <div className="id-card-field-value id-card-mono">{patient.qr_code || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="id-card-footer">
                    <div className="id-card-footer-left">
                      <Fingerprint style={{ width: 14, height: 14, opacity: 0.7 }} />
                      <span>Scan QR code on back</span>
                    </div>
                    <div className="id-card-footer-right">medqr.gov • {new Date().getFullYear()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK label */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ background: "linear-gradient(135deg, #0c2340, #1a4480)", color: "white", fontSize: "10px", fontWeight: 800, padding: "2px 10px", borderRadius: "999px", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Side 2 — Back (QR)
                </span>
              </div>

              {/* ── BACK card (screen preview) ───────────────────────── */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="id-card-back">
                  <div className="id-card-back-qr">
                    {qrValue
                      ? <QRCodeSVG value={qrValue} size={130} level="H" includeMargin={false} bgColor="#ffffff" fgColor="#0f172a" />
                      : <div style={{ width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No QR</div>}
                  </div>
                  <div className="id-card-back-label">Scan to Access Medical Record</div>
                  <div className="id-card-back-id">{patient.qr_code}</div>
                </div>
              </div>
            </div>
          </div>
          {/* ── end screen preview ───────────────────────────────── */}


          {/* ══════════════════════════════════════════════════════
              PRINT ROOT — two-sided (hidden on screen, prints only)
          ══════════════════════════════════════════════════════ */}
          <div className="card-print-root">

            {/* Page 1 — Front */}
            <div className="card-print-page">
              <div className="id-card-wrapper">
                <div className="id-card" id="medqr-id-card-front">
                  <div className="id-card-header">
                    <div className="id-card-header-pattern" />
                    <div className="id-card-logo-row">
                      <div className="id-card-logo-icon"><Shield style={{ width: 20, height: 20, color: "white" }} /></div>
                      <div>
                        <div className="id-card-org">MINISTRY OF HEALTH</div>
                        <div className="id-card-title">National Health Registry</div>
                      </div>
                      <div className="id-card-flag">🏥</div>
                    </div>
                    <div className="id-card-label-band">CITIZEN HEALTH IDENTITY CARD</div>
                  </div>

                  <div className="id-card-body">
                    <div className="id-card-photo-col">
                      <div className="id-card-photo-frame">
                        {patient.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={patient.photo_url} alt="Citizen" className="id-card-photo-img" />
                          : <div className="id-card-photo-placeholder"><User style={{ width: 40, height: 40, color: "#94a3b8" }} /></div>}
                      </div>
                      <div className="id-card-blood-badge">
                        <Droplet style={{ width: 10, height: 10 }} />{patient.blood_type || "—"}
                      </div>
                    </div>

                    <div className="id-card-info-col">
                      <div className="id-card-name">{patient.first_name} {patient.last_name}</div>
                      <div className="id-card-fields">
                        <div className="id-card-field">
                          <div className="id-card-field-label">Gender</div>
                          <div className="id-card-field-value">{patient.gender || "—"}</div>
                        </div>
                        <div className="id-card-field">
                          <div className="id-card-field-label">Date of Birth</div>
                          <div className="id-card-field-value">{patient.dob || patient.age || "—"}</div>
                        </div>
                        <div className="id-card-field" style={{ gridColumn: "1 / -1" }}>
                          <div className="id-card-field-label">Registry ID</div>
                          <div className="id-card-field-value id-card-mono">{patient.qr_code || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="id-card-footer">
                    <div className="id-card-footer-left">
                      <Fingerprint style={{ width: 14, height: 14, opacity: 0.7 }} />
                      <span>Scan QR code on back</span>
                    </div>
                    <div className="id-card-footer-right">medqr.gov • {new Date().getFullYear()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 — Back (QR code) */}
            <div className="card-print-page">
              <div className="id-card-back" id="medqr-id-card-back">
                <div className="id-card-back-qr">
                  {qrValue
                    ? <QRCodeSVG value={qrValue} size={130} level="H" includeMargin={false} bgColor="#ffffff" fgColor="#0f172a" />
                    : <div style={{ width: 130, height: 130 }} />}
                </div>
                <div className="id-card-back-label">Scan to Access Medical Record</div>
                <div className="id-card-back-id">{patient.qr_code}</div>
              </div>
            </div>

          </div>
          {/* ── end card-print-root ───────────────────────────── */}

        </div>
      )}
    </div>
    </div>
  );
}
