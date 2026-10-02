"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import RoleGuard from "@/components/RoleGuard";
import { QRCodeCanvas } from "qrcode.react";
import {
  User,
  Calendar,
  Activity,
  Droplet,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  HeartPulse,
  Stethoscope,
  Printer,
  RefreshCw,
  Camera,
  Upload,
  X,
  Shield,
  Fingerprint,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function RegisterCitizen() {
  return (
    <RoleGuard allowedRole={["ministry", "superadmin"]}>
      <RegisterCitizenContent />
    </RoleGuard>
  );
}

function RegisterCitizenContent() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    bloodType: "",
    conditions: "",
    history: "",
    allergies: "",
    securityPin: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  // Photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // ─── Camera helpers ──────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API not supported on this browser. Please use HTTPS or upload a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata before calling play to avoid AbortError on slow streams
        await new Promise<void>((resolve) => {
          const vid = videoRef.current!;
          if (vid.readyState >= 1) {
            resolve();
          } else {
            vid.onloadedmetadata = () => resolve();
          }
        });
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError("Camera access denied. Please allow camera permissions in your browser settings, then try again.");
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError("No camera found on this device. Please upload a photo instead.");
      } else if (name === 'NotReadableError') {
        setCameraError("Camera is in use by another application. Close it and try again, or upload a photo.");
      } else {
        setCameraError("Camera not available. Please upload a photo instead.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhotoDataUrl(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke any previous object URL to avoid memory leaks
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPhotoDataUrl(url);
  };

  const removePhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPhotoDataUrl(null);
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Form submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessData(null);

    try {
      const res = await fetch("/api/citizens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, securityPin: formData.securityPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
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
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      bloodType: "",
      conditions: "",
      history: "",
      allergies: "",
      securityPin: "",
    });
    setError("");
    setSuccessData(null);
    removePhoto();
  };

  const patientDisplay = {
    ...formData,
    ...successData,
    first_name: successData?.first_name || formData.firstName,
    last_name: successData?.last_name || formData.lastName,
    blood_type: successData?.blood_type || formData.bloodType,
    dob: successData?.dob || formData.dob,
    id: successData?.id,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="no-print">
        <Breadcrumbs
          items={[{ label: 'Ministry', href: '/ministry' }, { label: 'Register Citizen' }]}
          backHref="/ministry"
          backLabel="Dashboard"
        />
      </div>

      <div className="container max-w-4xl p-8 fade-in">
        {/* Hero Header */}
        <div className="page-header-banner no-print">
          <h1 className="page-header-title">Citizen Enrollment & Health ID Registration</h1>
          <p className="page-header-subtitle">
            Enroll a new citizen into the National Health Registry and generate their encrypted MedQR identity pass.
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
          {/* Photo Capture Section */}
          <div className="mb-8 border-b border-border-color pb-8">
            <h3 className="flex items-center gap-2 mb-6" style={{ color: "var(--accent)" }}>
              <Camera className="w-5 h-5" /> Citizen Photo
            </h3>

            {cameraError && (
              <div className="alert-modern alert-error mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{cameraError}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Preview area */}
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: 160,
                  height: 200,
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "rgba(14,165,233,0.06)",
                  border: photoDataUrl || cameraActive ? "2px solid var(--primary)" : "2px dashed var(--primary)",
                  boxShadow: photoDataUrl ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
                }}
              >
                {photoDataUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoDataUrl}
                      alt="Citizen photo"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        background: "rgba(239,68,68,0.92)",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "white",
                        zIndex: 10,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 16,
                    }}
                  >
                    <User style={{ width: 48, height: 48, opacity: 0.3, color: "var(--primary)" }} />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>No photo yet</div>
                  </div>
                )}
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Controls */}
              <div className="flex flex-col gap-3 flex-1">
                <p className="text-sm text-muted mb-2">
                  Take a webcam photo or upload from your device. The photo will be printed on the ID card.
                </p>

                {!cameraActive && !photoDataUrl && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startCamera}
                    style={{ justifyContent: "flex-start", gap: "0.5rem" }}
                  >
                    <Camera className="w-5 h-5" /> Open Webcam
                  </button>
                )}

                {cameraActive && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={capturePhoto}
                    style={{ justifyContent: "flex-start", gap: "0.5rem" }}
                  >
                    <Camera className="w-5 h-5" /> Capture Photo
                  </button>
                )}

                {cameraActive && (
                  <button
                    type="button"
                    className="btn"
                    onClick={stopCamera}
                    style={{
                      background: "rgba(100,116,139,0.15)",
                      color: "var(--text-muted)",
                      justifyContent: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}

                {!cameraActive && (
                  <>
                    <label
                      htmlFor="photo-upload"
                      className="btn"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        color: "var(--accent)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        cursor: "pointer",
                        justifyContent: "flex-start",
                        gap: "0.5rem",
                      }}
                    >
                      <Upload className="w-5 h-5" />
                      {photoDataUrl ? "Replace Photo" : "Upload from Device"}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </>
                )}

                {photoDataUrl && (
                  <div
                    className="flex items-center gap-2 mt-1"
                    style={{ color: "var(--success)", fontSize: 13, fontWeight: 600 }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Photo ready — will appear on card
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="mb-8 border-b border-border-color pb-8">
            <h3 className="flex items-center gap-2 mb-6 text-primary">
              <Users className="w-5 h-5" /> Personal Details
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
                    placeholder="E.g., John"
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
                    placeholder="E.g., Doe"
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
            </div>
          </div>

          {/* Medical Info */}
          <div className="mb-8">
            <h3 className="flex items-center gap-2 mb-6 text-danger">
              <HeartPulse className="w-5 h-5" /> Medical Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="form-group">
                <label className="form-label">Security PIN (4 digits) *</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    className="input-modern pl-12"
                    placeholder="••••"
                    value={formData.securityPin}
                    onChange={(e) => setFormData({ ...formData, securityPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    disabled={loading}
                  />
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  This PIN will be required to access the patient's medical record.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Type</label>
                <div className="relative">
                  <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <select
                    className="select-modern pl-12"
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    disabled={loading}
                  >
                    <option value="">Select Blood Type...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Underlying Conditions</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-4 w-5 h-5 text-muted" />
                  <textarea
                    rows={3}
                    className="textarea-modern pl-12 resize-vertical"
                    placeholder="E.g., Hypertension, Diabetes..."
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Medical History</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-muted" />
                  <textarea
                    rows={3}
                    className="textarea-modern pl-12 resize-vertical"
                    placeholder="Past surgeries, major illnesses..."
                    value={formData.history}
                    onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Allergies</label>
                <div className="relative">
                  <Stethoscope className="absolute left-4 top-4 w-5 h-5 text-muted" />
                  <textarea
                    rows={2}
                    className="textarea-modern pl-12 resize-vertical"
                    placeholder="Medications, food, environmental..."
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
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
                Registering Citizen...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 mr-3" />
                Register &amp; Generate ID Card
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="fade-in">
          <div className="alert-modern alert-success mb-8 no-print">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-lg">Registration Successful!</p>
              <p className="text-sm mt-1">
                The citizen has been enrolled. Preview the ID card below, then print it.
              </p>
            </div>
          </div>

          {/* ── PREMIUM ID CARD ─────────────────────────────────────── */}
          <div className="print-area" id="id-card-print-area">
            <div className="id-card-wrapper">
              {/* Front of card */}
              <div className="id-card" id="medqr-id-card">
                {/* Header strip */}
                <div className="id-card-header">
                  <div className="id-card-header-pattern" />
                  <div className="id-card-logo-row">
                    <div className="id-card-logo-icon">
                      <Shield style={{ width: 20, height: 20, color: "white" }} />
                    </div>
                    <div>
                      <div className="id-card-org">MINISTRY OF HEALTH</div>
                      <div className="id-card-title">National Health Registry</div>
                    </div>
                    <div className="id-card-flag">🏥</div>
                  </div>
                  <div className="id-card-label-band">CITIZEN HEALTH IDENTITY CARD</div>
                </div>

                {/* Card body */}
                <div className="id-card-body">
                  {/* Left: photo */}
                  <div className="id-card-photo-col">
                    <div className="id-card-photo-frame">
                      {photoDataUrl ? (
                        <Image
                          src={photoDataUrl}
                          alt="Citizen"
                          width={92}
                          height={112}
                          unoptimized
                          className="id-card-photo-img"
                        />
                      ) : (
                        <div className="id-card-photo-placeholder">
                          <User style={{ width: 40, height: 40, color: "#94a3b8" }} />
                        </div>
                      )}
                    </div>
                    <div className="id-card-blood-badge">
                      <Droplet style={{ width: 10, height: 10 }} />
                      {patientDisplay.blood_type || "—"}
                    </div>
                  </div>

                  {/* Right: info */}
                  <div className="id-card-info-col">
                    <div className="id-card-name">
                      {patientDisplay.first_name} {patientDisplay.last_name}
                    </div>

                    <div className="id-card-fields">
                      <div className="id-card-field">
                        <div className="id-card-field-label">Date of Birth</div>
                        <div className="id-card-field-value">{patientDisplay.dob || patientDisplay.age || "—"}</div>
                      </div>
                      <div className="id-card-field" style={{ gridColumn: "1 / -1" }}>
                        <div className="id-card-field-label">Registry ID</div>
                        <div className="id-card-field-value id-card-mono">
                          {patientDisplay.qr_code || "—"}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="id-card-qr-wrap">
                      <QRCodeCanvas
                        id="citizen-qr-canvas"
                        value={successData.qr_code}
                        size={88}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer strip */}
                <div className="id-card-footer">
                  <div className="id-card-footer-left">
                    <Fingerprint style={{ width: 14, height: 14, opacity: 0.7 }} />
                    <span>Scan QR for full medical history</span>
                  </div>
                  <div className="id-card-footer-right">
                    medqr.gov • {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 no-print">
            <button className="btn btn-primary px-10 py-3 text-lg shadow-xl" onClick={handlePrint}>
              <Printer className="w-5 h-5 mr-2" /> Print ID Card
            </button>
            <button
              className="btn btn-secondary px-10 py-3 text-lg"
              onClick={resetForm}
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Register Another
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}