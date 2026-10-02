"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { 
  Stethoscope, Activity, FileText, Beaker, Pill, 
  History, Search, Loader2, Save, Plus, AlertCircle,
  CheckCircle2, Clock, User, ShieldAlert, ArrowRightLeft, X, Menu
} from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import DoctorEpisodesTable from "./DoctorEpisodesTable";
import Breadcrumbs from "@/components/Breadcrumbs";


export default function DoctorPortal() {
  return (
    <RoleGuard allowedRole="doctor">
      <DoctorContent />
    </RoleGuard>
  );
}

function DoctorContent() {
  const { staffId, institutionId } = useApp();
  const [activeTab, setActiveTab] = useState('history');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [episodeCode, setEpisodeCode] = useState('');
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralDoctorId, setReferralDoctorId] = useState('');
  const [referralNote, setReferralNote] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [referralSaving, setReferralSaving] = useState(false);
  const diagnosisRef = useRef<HTMLTextAreaElement>(null);

  // Load available doctors for referral
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await fetch('/api/staff');
        const data = await res.json();
        if (res.ok && Array.isArray(data.staff)) {
          setDoctors(data.staff.filter((s: any) => s.occupation === 'doctor' && s.id !== staffId && s.is_active !== false));
        }
      } catch {
        setDoctors([]);
      }
    };
    loadDoctors();
  }, [staffId]);

  // Form states
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState([{ drugId: "", dosage: "", instructions: "", requestedQuantity: "" }]);
  const [inventoryDrugs, setInventoryDrugs] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    fetch('/api/drugs?activeOnly=true').then(res => res.json()).then(data => {
      if(data.success) setInventoryDrugs(data.drugs);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/episodes?code=${encodeURIComponent(episodeCode)}`);
      const data = await res.json();
      if (res.ok && data.episode) {
        setEpisode(data.episode);
        // Load existing diagnosis if any
        fetchDiagnosis(data.episode.id);
        // Load test results
        fetchTestResults(data.episode.id);
      } else {
        alert("Episode not found");
      }
    } catch (err) {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

const fetchDiagnosis = async (id: string) => {
    try {
      const res = await fetch(`/api/diagnoses?episodeId=${id}`);
      const data = await res.json();
      if (data.diagnoses?.[0]) {
        setDiagnosisNotes(data.diagnoses[0].notes);
      }
      setTimeout(() => {
        if (diagnosisRef.current) {
          diagnosisRef.current.style.height = 'auto';
          diagnosisRef.current.style.height = diagnosisRef.current.scrollHeight + 'px';
        }
      }, 50);
    } catch (err) {}
  };

  const fetchTestResults = async (id: string) => {
    setLoadingTests(true);
    try {
      const res = await fetch(`/api/tests?episodeId=${id}`);
      const data = await res.json();
      if (res.ok && data.tests) {
        setTestResults(data.tests.filter((t: any) => t.results)); // Only completed results
      } else {
        setTestResults([]);
      }
    } catch (err) {
      setTestResults([]);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleSaveDiagnosis = async () => {
    if (!episode || !diagnosisNotes) return;
    setSaving(true);
    try {
      const res = await fetch("/api/diagnoses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: episode.id,
          doctorId: staffId || "demo-doc-1",
          notes: diagnosisNotes
        }),
      });
      if (res.ok) {
        showSuccess("Diagnosis updated and saved to medical record.");
      }
    } catch (err) {
      alert("Failed to save diagnosis");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestTests = async () => {
    if (!episode || selectedTests.length === 0) return;
    setSaving(true);
    try {
      for (const testType of selectedTests) {
        await fetch("/api/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            episodeId: episode.id,
            doctorId: staffId || "demo-doc-1",
            testType
          }),
        });
      }
      showSuccess(`${selectedTests.length} Laboratory tests requested.`);
      setSelectedTests([]);
    } catch (err) {
      alert("Failed to request tests");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPrescription = async () => {
    if (!episode || prescriptions.some(p => !p.drugId || !p.dosage || !p.requestedQuantity)) return;
    setSaving(true);
    try {
      for (const p of prescriptions) {
        await fetch("/api/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            episodeId: episode.id,
            doctorId: staffId || "demo-doc-1",
            drugId: p.drugId,
            dosage: p.dosage,
            instructions: p.instructions,
            requestedQuantity: p.requestedQuantity
          }),
        });
      }
      showSuccess("Prescription transmitted to Pharmacy.");
      setPrescriptions([{ drugId: "", dosage: "", instructions: "", requestedQuantity: "" }]);
    } catch (err) {
      alert("Failed to send prescription");
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleReferral = async () => {
    if (!episode || !referralDoctorId) return;
    setReferralSaving(true);
    try {
      const res = await fetch('/api/episodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episode.id,
          status: 'in_consultation',
          assignedDoctorId: referralDoctorId,
          referralNote: referralNote || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEpisode(data.episode);
        setShowReferralModal(false);
        setReferralDoctorId('');
        setReferralNote('');
        showSuccess(`Patient referred to ${doctors.find((d: any) => d.id === referralDoctorId)?.full_name || 'specialist'}.`);
      } else {
        alert(data.error || 'Referral failed');
      }
    } catch {
      alert('Failed to send referral');
    } finally {
      setReferralSaving(false);
    }
  };

  if (!episode) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Doctor Clinical Workspace' }]} />

        <div className="container max-w-4xl mx-auto p-8 fade-in">
          <div className="page-header-banner">
            <h1 className="page-header-title">Doctor Consultation Workspace</h1>
            <p className="page-header-subtitle">
              Access live patient clinical queues, update diagnostic notes, order lab investigations, and transmit digital prescriptions.
            </p>
          </div>

          <DoctorEpisodesTable
            institutionId={institutionId}
            staffId={staffId}
            onSelect={(ep: any) => {
              setEpisode(ep);
              fetchDiagnosis(ep.id);
              fetchTestResults(ep.id);
            }}
            onSearchEpisode={handleSearch}
            episodeCode={episodeCode}
            setEpisodeCode={setEpisodeCode}
            loading={loading}
          />
        </div>
      </div>
    );
  } 

  return (
    <div className="container p-8 fade-in">
      {/* Consultation Header */}
      <div className="glass-card p-8 mb-10 border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center shadow-inner relative">
            <User className="w-10 h-10 text-blue-600" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 mb-1">{episode.patients.first_name} {episode.patients.last_name}</div>
              <div className="flex items-center gap-3 text-muted font-bold text-sm">
               <span className="bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-widest">{episode.episode_code}</span>
               <span>•</span>
               <span>{episode.patients.dob ? new Date(episode.patients.dob).toLocaleDateString() : '—'}</span>
               <span>•</span>
               <span className="text-blue-600">{episode.patients.gender}</span>
               <span>•</span>
               <span className="bg-red-50 text-red-500 px-2 rounded-lg">{episode.patients.blood_type}</span>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowReferralModal(true)}
            className="btn"
            style={{
              background: 'rgba(139,92,246,0.12)',
              color: '#7c3aed',
              border: '1px solid rgba(139,92,246,0.3)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Refer to Specialist
          </button>
          <button onClick={() => setEpisode(null)} className="btn btn-secondary shadow-sm">
            End Session
          </button>
          <div className="p-3 px-6 bg-emerald-50 text-emerald-700 rounded-2xl font-bold flex items-center gap-2 border border-emerald-100">
             <Clock className="w-4 h-4" />
             In Consultation
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="alert-modern alert-success mb-8 flex items-center gap-4 p-6 animate-slide-up">
          <CheckCircle2 className="w-8 h-8" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
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
          onClick={() => setShowReferralModal(false)}
        >
          <div
            className="glass-card fade-in"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2rem',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(15,23,42,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft className="text-purple-600" />
                Refer Patient
              </h3>
              <button
                onClick={() => setShowReferralModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm font-bold mb-1">
                {episode?.patients?.first_name} {episode?.patients?.last_name}
              </div>
              <div className="text-muted text-xs font-mono">{episode?.episode_code}</div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Refer to Doctor</label>
              <select
                className="select-modern"
                value={referralDoctorId}
                onChange={(e) => setReferralDoctorId(e.target.value)}
              >
                <option value="">— Select Specialist —</option>
                {doctors.map((doc: any) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name} {doc.doctor_services?.length ? `(${doc.doctor_services.join(', ')})` : ''}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && (
                <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
                  No other doctors available for referral.
                </div>
              )}
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Referral Note (optional)</label>
              <textarea
                className="textarea-modern"
                rows={3}
                placeholder="Reason for referral, clinical summary..."
                value={referralNote}
                onChange={(e) => setReferralNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setShowReferralModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleReferral}
                disabled={referralSaving || !referralDoctorId}
              >
                {referralSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                Send Referral
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>

        {/* Navigation Sidebar - Desktop */}
        <div className="hidden lg:flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="Medical History" />
          <TabButton active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')} icon={<FileText />} label="Diagnosis & Notes" />
          <TabButton active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} icon={<Beaker />} label="Test Orders" />
          <TabButton active={activeTab === 'lab-results'} onClick={() => setActiveTab('lab-results')} icon={<CheckCircle2 />} label="Lab Results" />
          <TabButton active={activeTab === 'prescription'} onClick={() => setActiveTab('prescription')} icon={<Pill />} label="Prescriptions" />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-white shadow-xl z-50 mobile-sidebar-drawer">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Navigation</h3>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close navigation menu"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <TabButton active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setMobileSidebarOpen(false); }} icon={<History />} label="Medical History" />
                  <TabButton active={activeTab === 'diagnosis'} onClick={() => { setActiveTab('diagnosis'); setMobileSidebarOpen(false); }} icon={<FileText />} label="Diagnosis & Notes" />
                  <TabButton active={activeTab === 'tests'} onClick={() => { setActiveTab('tests'); setMobileSidebarOpen(false); }} icon={<Beaker />} label="Test Orders" />
                  <TabButton active={activeTab === 'lab-results'} onClick={() => { setActiveTab('lab-results'); setMobileSidebarOpen(false); }} icon={<CheckCircle2 />} label="Lab Results" />
                  <TabButton active={activeTab === 'prescription'} onClick={() => { setActiveTab('prescription'); setMobileSidebarOpen(false); }} icon={<Pill />} label="Prescriptions" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="glass-card p-10 min-h-[500px] shadow-xl border-white/60">
            {activeTab === 'history' && (
              <div className="fade-in">
                <h2 className="mb-8 flex items-center gap-3 text-gray-800">
                  <History className="text-primary" /> Longitudinal Health Record
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4">Underlying Conditions</h4>
                    <p className="font-bold text-gray-700">{episode.patients.underlying_conditions || 'None Declared'}</p>
                  </div>
                  <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4">Past Medical History</h4>
                    <p className="font-bold text-gray-700">{episode.patients.medical_history || 'No recorded history'}</p>
                  </div>
                </div>

                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Historical Clinical Episodes</h4>
                <div className="space-y-4">
                  {/* Loaded from DB: show other episodes for the same patient */}
                  {(() => {
                    const patientEpisodes = (episode?.patients?.episodes ?? []).filter((ep: any) => ep.id !== episode?.id);
                    if (!patientEpisodes.length) {
                      return (
                        <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                          <h3 className="text-gray-400 mb-2">No Historical Episodes</h3>
                          <p className="text-muted">No previous episodes found for this patient.</p>
                        </div>
                      );
                    }
                    return patientEpisodes.slice(0, 6).map((ep: any) => (
                      <div key={ep.id} className="p-5 border border-border-color rounded-2xl bg-white/50 relative">
                        <div className="absolute right-6 top-6 text-[10px] font-bold text-muted bg-gray-100 px-2 py-0.5 rounded">
                          {ep.created_at ? new Date(ep.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                        </div>
                        <h5 className="font-black mb-1">{ep.episode_code}</h5>
                        <p className="text-sm text-muted">
                          Status: {ep.status || 'unknown'}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'diagnosis' && (
              <div className="fade-in">
                <h2 className="mb-8 flex items-center gap-3 text-gray-800">
                  <FileText className="text-primary" /> Clinical Assessment
                </h2>
                <div className="form-group mb-8">
                  <label className="form-label">Diagnosis & Clinical Notes *</label>
                  <textarea 
                    ref={diagnosisRef}
                    value={diagnosisNotes}
                    onChange={e => {
                      setDiagnosisNotes(e.target.value);
                      if (diagnosisRef.current) {
                        diagnosisRef.current.style.height = 'auto';
                        diagnosisRef.current.style.height = diagnosisRef.current.scrollHeight + 'px';
                      }
                    }}
                    placeholder="Enter thorough clinical observations, diagnosis, and plan..." 
                    className="textarea-modern w-full p-6"
                    style={{ minHeight: '8rem', resize: 'vertical' }}
                  />
                </div>
                <button 
                  onClick={handleSaveDiagnosis}
                  disabled={saving || !diagnosisNotes}
                  className="btn btn-primary px-10 py-4 font-bold flex items-center gap-3 shadow-lg"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
                  Save to National Record
                </button>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="fade-in">
                <h2 className="mb-8 flex items-center gap-3 text-gray-800">
                  <Beaker className="text-primary" /> Test Orders
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {['Full Blood Count', 'Malaria RDT', 'Liver Function Test', 'Urinalysis', 'Chest X-Ray', 'MRI Lumbar Spine'].map(test => (
                    <label key={test} className={`p-5 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${
                      selectedTests.includes(test) ? 'border-primary bg-blue-50/50 shadow-md' : 'border-gray-100 hover:border-blue-200'
                    }`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-primary rounded" 
                        checked={selectedTests.includes(test)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTests([...selectedTests, test]);
                          else setSelectedTests(selectedTests.filter(t => t !== test));
                        }}
                      />
                      <span className="font-bold text-gray-700">{test}</span>
                    </label>
                  ))}
                </div>
                <button 
                  onClick={handleRequestTests}
                  disabled={saving || selectedTests.length === 0}
                  className="btn btn-primary px-10 py-4 font-bold flex items-center gap-3 shadow-lg"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Plus className="w-5 h-5" />}
                  Transmit Orders ({selectedTests.length})
                </button>
              </div>
            )}

            {activeTab === 'lab-results' && (
              <div className="fade-in">
                <h2 className="mb-8 flex items-center gap-3 text-gray-800">
                  <CheckCircle2 className="text-emerald-500" /> Laboratory Results
                </h2>
                {loadingTests ? (
                  <div className="py-20 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-muted">Loading lab results...</p>
                  </div>
                ) : testResults.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                    <Beaker className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                    <h3 className="text-gray-400 mb-2">No Laboratory Results</h3>
                    <p className="text-muted">No test results available for this episode yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {testResults.map((test: any) => (
                      <div key={test.id} className="glass-card p-8 border-emerald-100 hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                              <h4 className="font-black text-xl text-gray-900">{test.test_type}</h4>
                              <p className="text-sm text-emerald-600 font-semibold">Completed: {new Date(test.updated_at || test.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="badge-modern badge-success px-4 py-2">Verified</div>
                        </div>
                        <div className="bg-white/70 p-6 rounded-2xl border-l-4 border-emerald-400">
                          <h5 className="font-bold text-lg mb-3 text-gray-800">Results</h5>
                          <pre className="whitespace-pre-wrap text-sm bg-emerald-50 p-4 rounded-xl font-mono border">{test.results}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="fade-in">
                <h2 className="mb-8 flex items-center gap-3 text-gray-800">
                  <Pill className="text-primary" /> Pharmacological Treatment
                </h2>
                <div className="space-y-6 mb-10">
                  {prescriptions.map((p, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-slide-right mb-4">
                      <div className="form-group md:col-span-1">
                        <label className="text-[10px] font-black text-muted uppercase mb-2 block">Medication Name</label>
                        <select 
                          value={p.drugId}
                          onChange={e => {
                            const newP = [...prescriptions];
                            newP[i].drugId = e.target.value;
                            setPrescriptions(newP);
                          }}
                          className="select-modern" 
                        >
                          <option value="">[ Select Drug ▼ ]</option>
                          {inventoryDrugs.map(drug => (
                            <option key={drug.id} value={drug.id}>
                              {drug.name} {drug.strength} (Available: {drug.quantity} {drug.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group md:col-span-1">
                        <label className="text-[10px] font-black text-muted uppercase mb-2 block">Requested Qty</label>
                        <input 
                          type="number"
                          min="1"
                          value={p.requestedQuantity}
                          onChange={e => {
                            const newP = [...prescriptions];
                            newP[i].requestedQuantity = e.target.value;
                            setPrescriptions(newP);
                          }}
                          className="input-modern" placeholder="E.g., 20" 
                        />
                      </div>
                      <div className="form-group md:col-span-1">
                        <label className="text-[10px] font-black text-muted uppercase mb-2 block">Dosage Regime</label>
                        <input 
                          value={p.dosage}
                          onChange={e => {
                            const newP = [...prescriptions];
                            newP[i].dosage = e.target.value;
                            setPrescriptions(newP);
                          }}
                          className="input-modern" placeholder="1x3 for 3 Days" 
                        />
                      </div>
                      <div className="form-group md:col-span-1 flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-muted uppercase mb-2 block">Instructions</label>
                          <input 
                            value={p.instructions}
                            onChange={e => {
                              const newP = [...prescriptions];
                              newP[i].instructions = e.target.value;
                              setPrescriptions(newP);
                            }}
                            className="input-modern" placeholder="Take after food" 
                          />
                        </div>
                        {prescriptions.length > 1 && (
                          <button 
                            className="btn btn-secondary px-3 py-3 mb-[2px]"
                            onClick={() => {
                              const newP = [...prescriptions];
                              newP.splice(i, 1);
                              setPrescriptions(newP);
                            }}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setPrescriptions([...prescriptions, { drugId: "", dosage: "", instructions: "", requestedQuantity: "" }])}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 font-bold mb-10"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Additional Medication
                </button>
                <div className="border-t border-border-color pt-8">
                  <button 
                    onClick={handleSendPrescription}
                    disabled={saving || prescriptions.some(p => !p.drugId || !p.dosage || !p.requestedQuantity)}
                    className="btn btn-primary px-10 py-4 font-bold flex items-center gap-3 shadow-lg"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                    Authorize & Transmit to Pharmacy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-2xl flex items-center gap-3 font-bold transition-all border-2 ${
        active 
          ? 'bg-blue-600 text-white border-blue-600 shadow-lg -translate-r-1' 
          : 'bg-white/50 text-gray-500 border-white/50 hover:bg-white hover:border-blue-100 hover:text-gray-700'
      }`}
    >
      <div className={active ? 'text-white' : 'text-primary'}>{icon}</div>
      <span className="text-sm">{label}</span>
    </button>
  );
}
