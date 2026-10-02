"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/lib/context";
import RoleGuard from "@/components/RoleGuard";
import { 
  Beaker, Search, ChevronLeft, CheckCircle2, 
  AlertCircle, Loader2, FlaskConical, FileText,
  Save, History, User, Activity
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function LabPortal() {
  return (
    <RoleGuard allowedRole="lab">
      <LabContent />
    </RoleGuard>
  );
}

function LabContent() {
  const { staffId } = useApp();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const [testRequests, setTestRequests] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const resultsRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const fetchQueue = useCallback(async (code?: string) => {
    setLoadingList(true);
    try {
      let url: string;
      if (!code) {
        url = '/api/episodes?status=waiting_lab';
      } else {
        // If it starts with EP, treat as episode code; otherwise search by patient name
        const trimmed = code.trim();
        const looksLikeCode = /^EP/i.test(trimmed);
        if (looksLikeCode) {
          url = `/api/episodes?code=${encodeURIComponent(trimmed)}`;
        } else {
          url = `/api/episodes?name=${encodeURIComponent(trimmed)}`;
        }
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setEpisodes(data.episodes || (data.episode ? [data.episode] : []));
      }
    } catch {
      setEpisodes([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const selectEpisode = async (episode: any) => {
    setSelectedEpisode(episode);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/tests?episodeId=${encodeURIComponent(episode.id)}`);
      const data = await res.json();
      if (res.ok) {
        setTestRequests(data.tests || []);
        const initialResults: Record<string, string> = {};
        data.tests.forEach((t: any) => {
          if (t.results) initialResults[t.id] = t.results;
        });
        setResults(initialResults);
      }
    } catch {
      setTestRequests([]);
    } finally {
      setLoadingDetail(false);
      setTimeout(() => {
        Object.keys(resultsRefs.current).forEach(id => {
          const el = resultsRefs.current[id];
          if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
          }
        });
      }, 50);
    }
  };

  const handleSaveResult = async (testId: string) => {
    if (!results[testId]) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          results: results[testId],
          labStaffId: staffId || 'demo-lab-1',
        }),
      });
      if (res.ok) {
        setTestRequests(prev => prev.map(t => t.id === testId ? { ...t, results: results[testId] } : t));
        alert('Laboratory results synchronized successfully');
      }
    } catch {
      alert('Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setSelectedEpisode(null);
    setTestRequests([]);
    fetchQueue();
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Laboratory Diagnostics' }]} />

      <div className="container max-w-5xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">National Laboratory &amp; Diagnostic Center</h1>
          <p className="page-header-subtitle">
            Process diagnostic test investigations, record verified results, and synchronize with national health records.
          </p>
        </div>

      {selectedEpisode ? (
        <div className="max-w-4xl mx-auto fade-in">
          <button className="btn bg-white/50 backdrop-blur border-white/40 mb-8 hover:bg-white transition-all shadow-sm" onClick={goBack}>
            <ChevronLeft className="w-5 h-5 mr-2" /> Back to Queue
          </button>

          <div className="glass-card p-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                 <User className="w-8 h-8 text-indigo-600" />
               </div>
               <div>
                 <h2 className="text-2xl font-black">{selectedEpisode.patients?.first_name} {selectedEpisode.patients?.last_name}</h2>
                  <p className="text-muted font-mono">{selectedEpisode.episode_code} • {selectedEpisode.patients?.dob ? new Date(selectedEpisode.patients.dob).toLocaleDateString() : '—'} / {selectedEpisode.patients?.gender}</p>
               </div>
            </div>
            <div className="badge-modern badge-primary uppercase tracking-widest px-6 py-2">Queue Active</div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="glass-card p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <FileText className="w-32 h-32" />
              </div>
              <h3 className="mb-8 flex items-center gap-3">
                <Beaker className="text-indigo-500" /> Pending Investigations
              </h3>

              {loadingDetail ? (
                <div className="py-20 text-center">
                   <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                   <p className="text-muted">Loading test details...</p>
                </div>
              ) : testRequests.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                   <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                   <p className="text-muted font-bold uppercase tracking-widest text-xs">No investigative orders found</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {testRequests.map((test) => (
                    <div key={test.id} className="p-8 bg-white/50 border border-border-color rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                             <Activity className="w-4 h-4 text-indigo-500" />
                           </div>
                           <h4 className="font-black text-xl text-gray-800">{test.test_type}</h4>
                        </div>
                        <div className={`badge-modern ${test.results ? 'badge-success' : 'badge-primary'}`}>
                           {test.results ? 'Completed' : 'Awaiting Processing'}
                        </div>
                      </div>

                      <div className="form-group mb-6">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 block">Investigation Results / Observations</label>
                        <textarea 
                          ref={el => { resultsRefs.current[test.id] = el; }}
                          value={results[test.id] || ""}
                          onChange={(e) => {
                            setResults({ ...results, [test.id]: e.target.value });
                            if (resultsRefs.current[test.id]) {
                              resultsRefs.current[test.id]!.style.height = 'auto';
                              resultsRefs.current[test.id]!.style.height = resultsRefs.current[test.id]!.scrollHeight + 'px';
                            }
                          }}
                          className="textarea-modern w-full p-4 text-sm"
                          placeholder="Record findings, measurements, and clinical observations..."
                          disabled={!!test.results}
                          style={{ minHeight: '4rem', resize: 'vertical' }}
                        />
                      </div>

                      {!test.results && (
                        <button 
                          onClick={() => handleSaveResult(test.id)}
                          disabled={saving || !results[test.id]}
                          className="btn btn-primary px-8 py-3 font-bold flex items-center gap-3 shadow-lg"
                        >
                          {saving ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
                          Synchronize Results
                        </button>
                      )}
                      {test.results && (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 w-fit px-4 py-2 rounded-xl border border-emerald-100">
                           <CheckCircle2 className="w-4 h-4" /> Verified Result
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="glass-card p-4 mb-10 flex gap-4 shadow-xl border-white/50">
            <div className="relative flex-1 group">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by episode code (e.g. EP-ABC123) or patient name..." 
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                className="input-modern pl-14 py-4 text-lg border-transparent hover:border-gray-100"
              />
            </div>
            <button onClick={() => fetchQueue(searchCode)} className="btn btn-primary px-10 font-bold bg-indigo-600 hover:bg-indigo-700">Search</button>
          </div>

          {/* Queue List */}
          {loadingList ? (
            <div className="py-20 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
              <p className="text-muted font-bold">Synchronizing laboratory queue...</p>
            </div>
          ) : episodes.length === 0 ? (
            <div className="glass-card p-20 text-center border-dashed border-gray-200">
               <FlaskConical className="w-20 h-20 text-gray-100 mx-auto mb-6" />
               <h3 className="text-gray-400">Lab Queue Empty</h3>
               <p className="text-muted">No pending investigative orders in the national queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {episodes.map((ep) => (
                <div 
                  key={ep.id} 
                  onClick={() => selectEpisode(ep)}
                  className="glass-card p-8 group hover:-translate-y-2 transition-all cursor-pointer border-white/60 hover:border-indigo-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Beaker className="text-indigo-600" />
                    </div>
                    <div className="badge-modern badge-primary uppercase tracking-tighter bg-indigo-500">Waiting</div>
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-1">{ep.episode_code}</h4>
                  <p className="text-muted font-bold">{ep.patients?.first_name} {ep.patients?.last_name}</p>
                  <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                    Process Investigation <History className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
