'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Activity, Users, Building2, Pill, Loader2, ArrowRight, ClipboardList, ShieldAlert, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface LogisticsData {
  totalCitizens: number;
  totalInstitutions: number;
  activeEpisodesToday: number;
  drugsDispensed: number;
  recentInstitutions: any[];
  recentEpisodes: any[];
}

export default function MinistryDashboard() {
  return (
    <RoleGuard allowedRole={["ministry", "superadmin"]}>
      <MinistryContent />
    </RoleGuard>
  );
}

function MinistryContent() {
  const [data, setData] = useState<LogisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Citizen QR Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundPatient, setFoundPatient] = useState<any>(null);

  const handleSearchCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setFoundPatient(null);

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchError("Enter a citizen name to search.");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/citizens?search=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to search citizens");
      }

      const match = data.patients?.[0];
      if (!match) {
        setSearchError("Citizen not found in database.");
        return;
      }

      setFoundPatient(match);
    } catch (err: any) {
      setSearchError(err?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/logistics')
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error || 'Failed to load logistics data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error: Unable to reach logistics server');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper flex-col items-center justify-center fade-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted font-medium pulse">Loading national health logistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl p-8 mt-8 fade-in">
        <div className="alert-modern alert-error">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-1">System Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Ministry Control Center' }]} />

      <div className="container p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">Ministry Control Center</h1>
          <p className="page-header-subtitle">
            National governance overview of healthcare institutions, citizen digital health IDs, and clinical logistics.
          </p>
        </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-12">
        <Link href="/ministry/register-citizen" className="btn btn-primary shadow-lg hover:shadow-xl transition-all">
          <Users className="w-5 h-5 mr-2" />
          Register Citizen
        </Link>
        <Link href="/ministry/citizens/qr" className="btn btn-secondary shadow-lg hover:shadow-xl transition-all">
          <Users className="w-5 h-5 mr-2" />
          Recover/Print QR
        </Link>
        <Link href="/ministry/register-institution" className="btn btn-secondary shadow-lg hover:shadow-xl transition-all">
          <Building2 className="w-5 h-5 mr-2" />
          Register Institution
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={<Users className="w-8 h-8 text-primary" />} 
          label="Total Citizens" 
          value={data?.totalCitizens || 0} 
        />
        <StatCard 
          icon={<Building2 className="w-8 h-8 text-secondary" />} 
          label="Institutions" 
          value={data?.totalInstitutions || 0} 
        />
        <StatCard 
          icon={<Activity className="w-8 h-8 text-accent" />} 
          label="Active Today" 
          value={data?.activeEpisodesToday || 0} 
        />
        <StatCard 
          icon={<Pill className="w-8 h-8 text-danger" />} 
          label="Dispensed" 
          value={data?.drugsDispensed || 0} 
        />
      </div>

      {/* Quick Citizen QR Lookup Widget */}
      <div className="glass-card p-8 mb-12 border-blue-100">
        <h2 className="text-2xl font-black mb-3 flex items-center gap-3">
          <Search className="text-primary w-6 h-6" /> Quick Citizen QR Search
        </h2>
        <p className="text-muted mb-6">
          Find a citizen by name to retrieve, view, and print their MedQR code instantly.
        </p>

        <form onSubmit={handleSearchCitizen} className="flex flex-col sm:flex-row gap-4 max-w-2xl mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              className="input-modern pl-12"
              placeholder="Search by first name, last name, or full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searchLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary px-8 font-bold flex items-center justify-center gap-2"
            disabled={searchLoading}
          >
            {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {searchError && (
          <div className="alert-modern alert-error max-w-2xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span className="font-semibold text-sm">{searchError}</span>
          </div>
        )}

        {foundPatient && (
          <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col md:flex-row items-center gap-8 animate-fade-in">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-shrink-0">
              <QRCodeSVG id="citizen-qr-print-source" value={foundPatient.qr_code} size={160} level="H" includeMargin />
            </div>

            <div className="w-full flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-xl font-bold m-0">{foundPatient.first_name} {foundPatient.last_name}</h3>
              </div>
              <div className="text-muted font-mono text-xs mb-4">Registry ID: {foundPatient.qr_code}</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mb-6">
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black text-muted uppercase tracking-wider">Date of Birth</div>
                  <div className="font-bold text-gray-900 mt-1">{foundPatient.dob ? new Date(foundPatient.dob).toLocaleDateString() : "—"}</div>
                </div>
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black text-muted uppercase tracking-wider">Gender</div>
                  <div className="font-bold text-gray-900 mt-1">{foundPatient.gender ?? "—"}</div>
                </div>
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black text-muted uppercase tracking-wider">Blood Type</div>
                  <div className="font-bold text-gray-900 mt-1">{foundPatient.blood_type ?? "—"}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-primary px-6 font-semibold"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (!printWindow) return;
                    
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Print QR - \${foundPatient.first_name} \${foundPatient.last_name}</title>
                          <style>
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              height: 100vh;
                              margin: 0;
                              background-color: #f8fafc;
                            }
                            .card {
                              border: 1px solid #e2e8f0;
                              padding: 40px;
                              border-radius: 24px;
                              background: white;
                              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                              text-align: center;
                              width: 320px;
                            }
                            .logo {
                              font-weight: 900;
                              font-size: 24px;
                              color: #0284c7;
                              margin-bottom: 20px;
                            }
                            h2 {
                              margin: 10px 0 5px 0;
                              color: #0f172a;
                              font-size: 22px;
                              font-weight: 800;
                            }
                            p {
                              color: #64748b;
                              font-family: monospace;
                              font-size: 14px;
                              margin: 0 0 25px 0;
                            }
                            .qr-wrapper {
                              display: inline-block;
                              padding: 16px;
                              background: white;
                              border: 1px solid #e2e8f0;
                              border-radius: 16px;
                            }
                            @media print {
                              body {
                                background: white;
                              }
                              .card {
                                border: none;
                                box-shadow: none;
                                padding: 0;
                              }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="logo">MedQR</div>
                            <h2>\${foundPatient.first_name} \${foundPatient.last_name}</h2>
                            <p>ID: \${foundPatient.qr_code}</p>
                            <div class="qr-wrapper" id="qr-target"></div>
                          </div>
                          <script>
                            const openerDoc = window.opener.document;
                            const localSvg = openerDoc.getElementById('citizen-qr-print-source');
                            if (localSvg) {
                              document.getElementById('qr-target').appendChild(localSvg.cloneNode(true));
                            }
                            setTimeout(() => {
                              window.print();
                              window.close();
                            }, 250);
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  Print QR Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Institutions */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-primary" />
            <h3 className="m-0 text-xl">Recent Institutions</h3>
          </div>
          
          {data?.recentInstitutions?.length ? (
            <div className="space-y-4">
              {data.recentInstitutions.map((inst: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-border-color bg-white/50 backdrop-blur hover:border-primary transition-colors flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">{inst.name}</div>
                    <div className="text-sm text-muted">{inst.location}</div>
                  </div>
                  <div className="badge-modern badge-primary">Active</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-border-color rounded-xl">
              <ClipboardList className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
              <p className="text-muted">No institutions registered yet.</p>
            </div>
          )}
        </div>

        {/* Recent Episodes */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-secondary" />
            <h3 className="m-0 text-xl">Live Health Episodes</h3>
          </div>

          {data?.recentEpisodes?.length ? (
            <div className="space-y-4">
              {data.recentEpisodes.map((ep: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-border-color bg-white/50 backdrop-blur hover:border-secondary transition-colors flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg flex items-center gap-2">
                      {ep.patient_first_name || 'Unknown'} {ep.patient_last_name || 'Patient'}
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ep.episode_code}</span>
                    </div>
                  </div>
                  <Link href={`/ministry/episodes/${ep.id}`} className="p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-blue-50">
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-border-color rounded-xl">
              <Activity className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
              <p className="text-muted">No active episodes tracked.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass-card p-6 flex items-center gap-5 hover:-translate-y-2 transition-transform duration-300">
      <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-bold mb-1 text-gray-900">{value.toLocaleString()}</div>
        <div className="text-sm font-medium text-muted uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
