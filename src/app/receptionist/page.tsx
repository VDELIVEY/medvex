"use client";

import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useApp } from "@/lib/context";
import { 
  Scan, User, Calendar, Activity, 
  ShieldAlert, CheckCircle2, ArrowRight,
  RefreshCw, Loader2, Search, HeartPulse, Stethoscope
} from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ReceptionistPortal() {
  return (
    <RoleGuard allowedRole="receptionist">
      <ReceptionistContent />
    </RoleGuard>
  );
}

function ReceptionistContent() {
  const { institutionId, setActiveEpisode } = useApp();
  const [step, setStep] = useState<'scan' | 'patient' | 'done'>('scan');
  const [scannedQR, setScannedQR] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [episodeCode, setEpisodeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [assignedDoctorId, setAssignedDoctorId] = useState('');

  // Load available doctors for assignment
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await fetch('/api/staff');
        const data = await res.json();
        if (res.ok && Array.isArray(data.staff)) {
          setDoctors(data.staff.filter((s: any) => s.occupation === 'doctor' && s.is_active !== false));
        }
      } catch {
        setDoctors([]);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    if (step !== 'scan') return;
    
    // Slight delay to ensure DOM element is ready
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);
      
      scanner.render(
        (decodedText: string) => {
          setScannedQR(decodedText);
          scanner.clear();
          fetchPatient(decodedText);
        },
        () => { }
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [step]);

  const fetchPatient = async (qr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/citizens?qr=${encodeURIComponent(qr)}`);
      const data = await res.json();
      if (data.patient) {
        setPatientData(data.patient);
        setStep('patient');
      } else {
        alert('Patient not found in national registry');
        setStep('scan');
      }
    } catch (err) {
      alert('Failed to connect to national registry');
      setStep('scan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEpisode = async () => {
    if (!patientData) return;
    setLoading(true);
    try {
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patientId: patientData.id, 
          institutionId: institutionId || 'demo-inst-1',
          assignedDoctorId: assignedDoctorId || null,
          chiefComplaint: ''
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEpisodeCode(data.episode.episode_code);
        setActiveEpisode(data.episode.id, patientData.id);
        setStep('done');
      } else {
        alert(data.error || 'Failed to create medical episode');
      }
    } catch (err) {
      alert('Network error: Unable to create episode');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('scan');
    setScannedQR('');
    setEpisodeCode('');
    setPatientData(null);
    setAssignedDoctorId('');
    setActiveEpisode(null);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Receptionist & Patient Check-in' }]} />

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">Patient Reception &amp; Rapid Check-in</h1>
          <p className="page-header-subtitle">
            Scan the national medical QR pass to retrieve citizen health profile and initiate a live clinical episode.
          </p>
        </div>

      {step === 'scan' && (
        <div className="glass-card p-10 max-w-2xl mx-auto border-white/40 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-pulse"></div>
          <div className="text-center mb-8">
            <h3 className="mb-2">Awaiting Identification</h3>
            <p className="text-muted">Align the patient's card within the frame below</p>
          </div>
          <div id="reader" className="rounded-3xl overflow-hidden border-4 border-emerald-100 shadow-inner bg-gray-900/5"></div>
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-4 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full font-bold text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Real-time scanner active
            </div>
          </div>
        </div>
      )}

      {step === 'patient' && (
        <div className="glass-card p-10 max-w-3xl mx-auto fade-in">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Patient Identified</h2>
                <p className="text-muted font-mono text-sm uppercase tracking-widest">{scannedQR}</p>
              </div>
            </div>
            <button onClick={reset} className="btn bg-gray-100 hover:bg-gray-200 text-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" /> New Scan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="p-6 bg-white/50 rounded-2xl border border-border-color">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 block">Personal Identity</label>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Name</span>
                  <span className="font-bold text-gray-900">{patientData.first_name} {patientData.last_name}</span>
                </div>
                  <div className="flex justify-between">
                   <span className="text-gray-500 font-medium">DOB / Gender</span>
                   <span className="font-bold text-gray-900">{patientData.dob ? new Date(patientData.dob).toLocaleDateString() : '—'} / {patientData.gender}</span>
                 </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Blood Group</span>
                  <span className="font-bold text-primary">{patientData.blood_type || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100">
              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 block">Urgent Medical Alerts</label>
              {(patientData.underlying_conditions || patientData.medical_history) ? (
                <div className="flex gap-3 text-red-700">
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                  <p className="text-sm font-semibold leading-relaxed">
                    {patientData.underlying_conditions || patientData.medical_history}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold">No critical alerts found</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="form-label flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" /> Assign Doctor
            </label>
            <select
              className="select-modern"
              value={assignedDoctorId}
              onChange={(e) => setAssignedDoctorId(e.target.value)}
              disabled={loading}
            >
              <option value="">— Select Doctor (optional) —</option>
              {doctors.map((doc: any) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.full_name}{doc.doctor_services?.length ? ` — ${doc.doctor_services.join(', ')}` : ''}
                </option>
              ))}
            </select>
            {doctors.length === 0 && (
              <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
                No doctors available. The episode will be unassigned.
              </div>
            )}
          </div>

          <button 
            className="w-full btn btn-primary py-5 text-lg font-bold flex items-center justify-center gap-3 shadow-2xl" 
            onClick={handleCreateEpisode} 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />}
            Initiate Medical Episode
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="glass-card p-12 max-w-2xl mx-auto text-center fade-in border-emerald-200/50">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="mb-2">Episode Synchronized</h2>
          <p className="text-muted mb-10">Medical episode created successfully. National ID and tracking code assigned.</p>
          
          <div className="bg-gray-900 rounded-3xl p-8 mb-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <HeartPulse className="w-32 h-32 text-white" />
            </div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Unique Episode Code</label>
            <div className="text-5xl font-black text-white font-mono tracking-tighter">{episodeCode}</div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold border border-blue-100">
              <ArrowRight className="w-5 h-5" />
              Direction: Proceed to Cashier for Consultation Payment
            </div>
            <button onClick={reset} className="btn btn-secondary py-4 font-bold mt-4">
              Finish & Reset for Next Patient
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
