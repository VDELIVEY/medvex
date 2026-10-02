"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/lib/context';
import RoleGuard from '@/components/RoleGuard';
import { Search, Pill, ChevronLeft, CheckCircle2, AlertCircle, Loader2, Clipboard, Heart, PackageCheck, ShoppingBag, ShieldCheck, User } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Episode {
  id: string;
  episode_code: string;
  status: string;
  created_at: string;
  patients: { first_name: string; last_name: string; age: number; gender: string; dob?: string | null; } | null;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  instructions: string;
  requested_quantity: number;
  dispensed_quantity: number;
  status: string;
  drugs: { name: string; strength: string; unit: string; quantity: number; } | null;
}

interface Diagnosis { id: string; notes: string; }

export default function PharmacyPortal() {
  return <RoleGuard allowedRole="pharmacy"><PharmacyContent /></RoleGuard>;
}

function PharmacyContent() {
  const { staffId } = useApp();
  const [activeTab, setActiveTab] = useState('queue');
  
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Pharmacy & Dispensing Desk' }]} />
      <div className="container max-w-5xl mx-auto p-8 fade-in">
        <div className="page-header-banner mb-6">
          <h1 className="page-header-title">Pharmacy &amp; Prescription Dispensing</h1>
          <p className="page-header-subtitle">Review doctor-authorized medication prescriptions, verify clinical diagnoses, and confirm fulfillment.</p>
        </div>
        
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab('queue')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'queue' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Prescription Queue</button>
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Drug Inventory</button>
        </div>

        {activeTab === 'queue' && <PharmacyQueue staffId={staffId} />}
        {activeTab === 'inventory' && <PharmacyInventory />}
      </div>
    </div>
  );
}

function PharmacyQueue({ staffId }: { staffId: string | null }) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dispenseModal, setDispenseModal] = useState<Prescription | null>(null);
  const [dispenseQty, setDispenseQty] = useState('');
  const [dispensing, setDispensing] = useState(false);

  const fetchEpisodes = useCallback(async (search?: string) => {
    setLoadingList(true);
    try {
      const url = search ? `/api/pharmacy?code=${encodeURIComponent(search.trim())}` : '/api/pharmacy';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setEpisodes(data.episodes || []);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { fetchEpisodes(); }, [fetchEpisodes]);

  const selectEpisode = async (episode: Episode) => {
    setSelectedEpisode(episode);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/pharmacy?episodeId=${encodeURIComponent(episode.id)}`);
      const data = await res.json();
      if (res.ok) {
        setPrescriptions(data.prescriptions || []);
        setDiagnoses(data.diagnoses || []);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const reloadPrescriptions = async () => {
    if(!selectedEpisode) return;
    try {
      const res = await fetch(`/api/pharmacy?episodeId=${encodeURIComponent(selectedEpisode.id)}`);
      const data = await res.json();
      if (res.ok) setPrescriptions(data.prescriptions || []);
    } catch(e) {}
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseModal) return;
    setDispensing(true);
    try {
      const res = await fetch('/api/prescriptions/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId: dispenseModal.id, quantity: parseInt(dispenseQty) }),
      });
      const data = await res.json();
      if (res.ok) {
        setDispenseModal(null);
        setDispenseQty('');
        reloadPrescriptions();
      } else {
        alert(data.error || 'Failed to dispense');
      }
    } finally {
      setDispensing(false);
    }
  };

  if (selectedEpisode) {
    return (
      <div className="max-w-4xl mx-auto">
        <button className="btn bg-white/50 backdrop-blur border-white/40 mb-8 hover:bg-white shadow-sm" onClick={() => { setSelectedEpisode(null); fetchEpisodes(searchCode.trim() || undefined); }}>
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Queue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border-pink-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center"><User className="text-pink-600" /></div>
                <div>
                  <h3 className="m-0 text-lg">{selectedEpisode.patients?.first_name} {selectedEpisode.patients?.last_name}</h3>
                  <p className="text-xs text-muted font-mono">{selectedEpisode.episode_code}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6 bg-emerald-50/50 border-emerald-100">
              <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Heart className="w-3 h-3" /> Clinical Diagnosis</h4>
              <p className="text-sm font-semibold text-emerald-900 italic">{diagnoses.length > 0 ? diagnoses.map(d => d.notes).join(', ') : 'No notes provided'}</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><PackageCheck className="w-32 h-32" /></div>
              <h3 className="mb-8 flex items-center gap-3"><Clipboard className="text-pink-500" /> Authorized Medication</h3>

              {loadingDetail ? (
                <div className="py-12 text-center"><Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-4" /><p className="text-muted">Fetching details...</p></div>
              ) : prescriptions.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl"><AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-muted">No medications found.</p></div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx) => {
                    const isFullyDispensed = rx.status === 'DISPENSED';
                    const remaining = rx.requested_quantity - (rx.dispensed_quantity || 0);
                    return (
                      <div key={rx.id} className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-4 ${isFullyDispensed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-gray-900 text-lg mb-1">{rx.drugs ? `${rx.drugs.name} ${rx.drugs.strength || ''}` : rx.medication}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-lg">{rx.dosage}</span>
                              <span className="text-xs font-bold text-gray-500">Requested: {rx.requested_quantity} {rx.drugs?.unit}</span>
                              <span className="text-xs font-bold text-gray-500">Dispensed: {rx.dispensed_quantity || 0}</span>
                            </div>
                            {rx.drugs && (
                              <div className="mt-2 text-xs font-semibold text-gray-400">Available Stock: <span className={rx.drugs.quantity < remaining ? "text-red-500" : ""}>{rx.drugs.quantity}</span> {rx.drugs.unit}</div>
                            )}
                          </div>
                          {isFullyDispensed ? (
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-white" /></div>
                          ) : (
                            <button onClick={() => setDispenseModal(rx)} className="btn btn-primary px-4 py-2 text-sm">Dispense</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {dispenseModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-2">Confirm Dispensing</h3>
              <p className="text-sm text-gray-500 mb-4">{dispenseModal.drugs?.name} {dispenseModal.drugs?.strength}</p>
              <form onSubmit={handleDispense}>
                <div className="mb-6">
                  <label className="form-label">Quantity to Dispense (Remaining: {dispenseModal.requested_quantity - (dispenseModal.dispensed_quantity || 0)})</label>
                  <input type="number" min="1" max={Math.min(dispenseModal.drugs?.quantity || 0, dispenseModal.requested_quantity - (dispenseModal.dispensed_quantity || 0))} required value={dispenseQty} onChange={e=>setDispenseQty(e.target.value)} className="input-modern" placeholder="Qty" />
                  <p className="text-xs text-muted mt-2">Available Stock: {dispenseModal.drugs?.quantity}</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => {setDispenseModal(null); setDispenseQty('');}} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={dispensing} className="btn btn-primary">{dispensing ? 'Processing...' : 'Confirm Dispense'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card p-4 mb-10 flex gap-4 shadow-xl border-white/50">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchCode} onChange={e => setSearchCode(e.target.value)} className="input-modern pl-14 py-4 text-lg border-transparent" />
        </div>
        <button onClick={() => fetchEpisodes(searchCode.trim())} className="btn btn-primary px-10 font-bold">Search</button>
      </div>
      {loadingList ? (
        <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" /><p className="text-muted">Loading...</p></div>
      ) : episodes.length === 0 ? (
        <div className="glass-card p-20 text-center border-dashed border-gray-200"><p className="text-muted">No pending prescriptions.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {episodes.map((ep) => (
            <div key={ep.id} onClick={() => selectEpisode(ep)} className="glass-card p-8 group hover:-translate-y-2 transition-all cursor-pointer border-white/60 hover:border-pink-300">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center"><Pill className="text-pink-600" /></div>
                <div className="badge-modern badge-primary">Ready</div>
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-1">{ep.episode_code}</h4>
              <p className="text-muted font-bold">{ep.patients?.first_name} {ep.patients?.last_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PharmacyInventory() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/drugs').then(res => res.json()).then(data => {
      if(data.success) setDrugs(data.drugs);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold mb-4">Drug Inventory</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b"><th className="p-3">Name</th><th className="p-3">Strength</th><th className="p-3">Unit</th><th className="p-3">Stock</th></tr>
        </thead>
        <tbody>
          {drugs.map(d => (
            <tr key={d.id} className="border-b"><td className="p-3 font-bold">{d.name}</td><td className="p-3">{d.strength || '—'}</td><td className="p-3">{d.unit}</td><td className="p-3 font-bold text-emerald-600">{d.quantity}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
