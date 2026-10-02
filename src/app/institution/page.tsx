'use client';

import React, { useState, useEffect } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { useApp } from '@/lib/context';
import {
  Activity, Users, Clock, TrendingUp, TrendingDown,
  Stethoscope, FlaskConical, Pill, CreditCard,
  AlertTriangle, CheckCircle, BarChart3, Heart,
  Thermometer, Droplet, BedDouble, UserCheck,
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  LineChart, Line, Legend,
} from 'recharts';

export default function InstitutionDashboard() {
  return (
    <RoleGuard allowedRole="admin">
      <InstitutionDashboardContent />
    </RoleGuard>
  );
}

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(16px)',
  borderRadius: '1.1rem',
  border: '1px solid rgba(226,232,240,0.8)',
  boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
  padding: '1.5rem',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.97)',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  fontSize: 12,
};

const TABS = ['Overview', 'Patient Flow', 'Clinical', 'Finance', 'Inventory'];

function InstitutionDashboardContent() {
  const { staffName, institutionId } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [kpis, setKpis] = useState<any>(null);
  const [weeklyAdmissions, setWeeklyAdmissions] = useState<any[]>([]);
  const [labTurnover, setLabTurnover] = useState<any[]>([]);
  const [prescriptionData, setPrescriptionData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bedOccupancy, setBedOccupancy] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [dailyBilling, setDailyBilling] = useState<any[]>([]);
  const [patientFlow, setPatientFlow] = useState<any[]>([]);
  const [waitTimes, setWaitTimes] = useState<any[]>([]);
  const [clinicalIndicators, setClinicalIndicators] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/institution/dashboard');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load dashboard');
        if (cancelled) return;
        
        setKpis(data.kpis);
        setWeeklyAdmissions(data.weeklyAdmissions || []);
        setLabTurnover(data.labTurnover || []);
        setPrescriptionData(data.prescriptionData || []);
        setRevenueData(data.revenueData || []);
        setBedOccupancy(data.bedOccupancy || []);
        setAlerts(data.alerts || []);
        setPaymentBreakdown(data.paymentBreakdown || []);
        setDailyBilling(data.dailyBilling || []);
        
        // Derive patient flow from weekly admissions
        setPatientFlow(data.weeklyAdmissions || []);
        setWaitTimes([]);
        setClinicalIndicators([]);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [institutionId]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="container fade-in" style={{ padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-8 fade-in">
        <div className="alert-modern alert-error">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold" style={{ fontSize: 16 }}>Dashboard Error</div>
            <div style={{ fontSize: 13, marginTop: 4 }} className="text-muted">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Institution Admin Portal' }]} />

      <div style={{ padding: '2rem 2.5rem', maxWidth: 1300, margin: '0 auto' }} className="fade-in">
        {/* ── Header Banner ────────────────────────────────────────────── */}
        <div className="page-header-banner flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="page-header-title">Facility Administration &amp; Operational Intelligence</h1>
            <p className="page-header-subtitle">
              {staffName || 'Administrator'} &nbsp;·&nbsp; {dateStr}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur px-5 py-2.5 rounded-2xl border border-white/20 shadow-sm flex flex-col gap-0.5 text-white">
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Administrator</span>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{staffName || 'Dr. Admin'}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#7dd3fc' }}>{institutionId || '—'}</span>
          </div>
        </div>

      {/* ── Alert Strip ─────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          {alerts.map((a: any, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 1rem', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              background: a.type === 'critical' ? 'rgba(239,68,68,0.1)' : a.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.1)',
              color: a.type === 'critical' ? '#dc2626' : a.type === 'warning' ? '#b45309' : '#0284c7',
              border: `1px solid ${a.type === 'critical' ? 'rgba(239,68,68,0.25)' : a.type === 'warning' ? 'rgba(245,158,11,0.25)' : 'rgba(14,165,233,0.25)'}`,
            }}>
              {a.type === 'critical'
                ? <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0 }} />
                : a.type === 'warning'
                ? <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0 }} />
                : <CheckCircle style={{ width: 13, height: 13, flexShrink: 0 }} />}
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <KpiCard icon={<Activity />} color="#0ea5e9" label="Patients Today" value={String(kpis.patientsToday || 0)} delta="" neutral />
          <KpiCard icon={<BedDouble />} color="#8b5cf6" label="Bed Occupancy" value={kpis.bedOccupancy || '0%'} delta="" neutral />
          <KpiCard icon={<Clock />} color="#10b981" label="Avg Wait Time" value={kpis.avgWaitTime || '—'} delta="" neutral />
          <KpiCard icon={<FlaskConical />} color="#f59e0b" label="Lab Tests Today" value={String(kpis.labTestsToday || 0)} delta="" neutral />
          <KpiCard icon={<Pill />} color="#06b6d4" label="Prescriptions" value={String(kpis.prescriptionsToday || 0)} delta="" neutral />
          <KpiCard icon={<UserCheck />} color="#ef4444" label="Discharged Today" value={String(kpis.dischargedToday || 0)} delta="" neutral />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(241,245,249,0.9)', borderRadius: '1rem', padding: '0.3rem', marginBottom: '1.5rem', width: 'fit-content', border: '1px solid #e2e8f0' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.55rem 1.35rem', borderRadius: '0.75rem', fontWeight: 700,
              fontSize: '0.875rem', border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────── */}
      {activeTab === 'Overview' && <OverviewTab weeklyAdmissions={weeklyAdmissions} labTurnover={labTurnover} prescriptionData={prescriptionData} revenueData={revenueData} bedOccupancy={bedOccupancy} />}
      {activeTab === 'Patient Flow' && <PatientFlowTab weeklyAdmissions={weeklyAdmissions} />}
      {activeTab === 'Clinical' && <ClinicalTab labTurnover={labTurnover} prescriptionData={prescriptionData} clinicalIndicators={clinicalIndicators} kpis={kpis} />}
      {activeTab === 'Finance' && <FinanceTab revenueData={revenueData} paymentBreakdown={paymentBreakdown} dailyBilling={dailyBilling} />}
      {activeTab === 'Inventory' && <InventoryTab />}
    </div>
    </div>
  );
}

/* ─────────────────────────── OVERVIEW TAB ─────────────────────────── */
function OverviewTab({ weeklyAdmissions, labTurnover, prescriptionData, revenueData, bedOccupancy }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Main area chart + dept bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* Admissions area chart */}
        <div style={CARD_STYLE}>
          <ChartHeader title="Weekly Admissions & Discharges" sub="Inpatient flow over the past 7 days" />
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAdmissions} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAdmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDisch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Admissions" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gradAdmit)" />
                <Area type="monotone" dataKey="Discharged" stroke="#10b981" strokeWidth={2} fill="url(#gradDisch)" />
                <Area type="monotone" dataKey="Emergency" stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bed occupancy */}
        <div style={CARD_STYLE}>
          <ChartHeader title="Bed Occupancy" sub="Current inpatient capacity" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {bedOccupancy.map((w: any) => {
              const pct = w.total > 0 ? Math.round((w.occupied / w.total) * 100) : 0;
              const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
              return (
                <div key={w.ward} style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '0.9rem 1.1rem', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{w.ward}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: '0.35rem' }}>{w.occupied} / {w.total} beds</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lab + Prescription row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={CARD_STYLE}>
          <ChartHeader title="Laboratory Throughput" sub="Tests ordered vs completed this week" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labTurnover} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} stackId="lab" />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="lab" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={CARD_STYLE}>
          <ChartHeader title="Prescription Fulfilment" sub="Issued vs dispensed by pharmacy" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prescriptionData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDispensed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Issued" stroke="#8b5cf6" strokeWidth={2} fill="url(#gIssued)" />
                <Area type="monotone" dataKey="Dispensed" stroke="#06b6d4" strokeWidth={2} fill="url(#gDispensed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── PATIENT FLOW TAB ─────────────────────────── */
function PatientFlowTab({ weeklyAdmissions }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={CARD_STYLE}>
        <ChartHeader title="Weekly Admissions & Discharges" sub="Inpatient flow over the past 7 days" />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyAdmissions} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Admissions" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Discharged" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Emergency" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── CLINICAL TAB ─────────────────────────── */
function ClinicalTab({ labTurnover, prescriptionData, clinicalIndicators, kpis }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Lab tests */}
        <div style={CARD_STYLE}>
          <ChartHeader title="Laboratory Throughput" sub="Tests ordered vs completed this week" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labTurnover} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} stackId="lab" />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="lab" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prescriptions */}
        <div style={CARD_STYLE}>
          <ChartHeader title="Prescription Fulfilment" sub="Issued vs dispensed by pharmacy" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prescriptionData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDispensed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Issued" stroke="#8b5cf6" strokeWidth={2} fill="url(#gIssued)" />
                <Area type="monotone" dataKey="Dispensed" stroke="#06b6d4" strokeWidth={2} fill="url(#gDispensed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clinical indicators */}
      <div style={CARD_STYLE}>
        <ChartHeader title="Clinical Indicators — Inpatient Summary" sub="Key health metrics across admitted patients (today)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          {[
            { icon: <Activity style={{ width: 18, height: 18 }} />, label: 'Active Episodes', value: String(kpis?.patientsToday || 0), color: '#0ea5e9', status: 'normal' },
            { icon: <FlaskConical style={{ width: 18, height: 18 }} />, label: 'Lab Tests Today', value: String(kpis?.labTestsToday || 0), color: '#f59e0b', status: 'normal' },
            { icon: <Pill style={{ width: 18, height: 18 }} />, label: 'Prescriptions', value: String(kpis?.prescriptionsToday || 0), color: '#06b6d4', status: 'normal' },
            { icon: <UserCheck style={{ width: 18, height: 18 }} />, label: 'Discharged Today', value: String(kpis?.dischargedToday || 0), color: '#10b981', status: 'normal' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '1rem 1.1rem', border: `1px solid #f1f5f9`, display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: '0.6rem', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, lineHeight: 1.2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── FINANCE TAB ─────────────────────────── */
function FinanceTab({ revenueData, paymentBreakdown, dailyBilling }: any) {
  const totalRevenue = (revenueData || []).reduce((s: number, r: any) => s + (Number(r.Revenue) || 0), 0);
  const totalClaims = (revenueData || []).reduce((s: number, r: any) => s + (Number(r.Claims) || 0), 0);
  const collectionRate = totalRevenue > 0 ? Math.round((totalClaims / totalRevenue) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Finance KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Revenue (YTD)', value: `UGX ${(totalRevenue / 1e6).toFixed(1)}M`, icon: <CreditCard style={{ width: 18, height: 18 }} />, color: '#10b981' },
          { label: 'Insurance Claims', value: `UGX ${(totalClaims / 1e6).toFixed(1)}M`, icon: <BarChart3 style={{ width: 18, height: 18 }} />, color: '#0ea5e9' },
          { label: 'Collection Rate', value: `${collectionRate}%`, icon: <TrendingUp style={{ width: 18, height: 18 }} />, color: '#8b5cf6' },
          { label: 'Outstanding Bills', value: 'UGX 3.8M', icon: <TrendingDown style={{ width: 18, height: 18 }} />, color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} style={{ ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={CARD_STYLE}>
        <ChartHeader title="Monthly Revenue vs Insurance Claims (2025)" sub="Gross revenue and insurance reimbursements" />
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClaims" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`UGX ${(v / 1e6).toFixed(1)}M`]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gRev)" />
              <Area type="monotone" dataKey="Claims" stroke="#0ea5e9" strokeWidth={2} fill="url(#gClaims)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payer breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={CARD_STYLE}>
          <ChartHeader title="Payment Method Breakdown" sub="How patients are settling bills" />
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown && paymentBreakdown.length > 0 ? paymentBreakdown : [
                    { name: 'Cash', value: 42, color: '#10b981' },
                    { name: 'NHIF/Insurance', value: 31, color: '#0ea5e9' },
                    { name: 'Corporate', value: 15, color: '#8b5cf6' },
                    { name: 'Waiver/Gov', value: 8, color: '#f59e0b' },
                    { name: 'Pending', value: 4, color: '#ef4444' },
                  ]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}
                >
                  {(paymentBreakdown && paymentBreakdown.length > 0 ? paymentBreakdown : [
                    { name: 'Cash', value: 42, color: '#10b981' },
                    { name: 'NHIF/Insurance', value: 31, color: '#0ea5e9' },
                    { name: 'Corporate', value: 15, color: '#8b5cf6' },
                    { name: 'Waiver/Gov', value: 8, color: '#f59e0b' },
                    { name: 'Pending', value: 4, color: '#ef4444' },
                  ]).map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
            {(paymentBreakdown && paymentBreakdown.length > 0 ? paymentBreakdown : [
              { name: 'Cash 42%', c: '#10b981' }, { name: 'Insurance 31%', c: '#0ea5e9' },
              { name: 'Corporate 15%', c: '#8b5cf6' }, { name: 'Gov Waiver 8%', c: '#f59e0b' }, { name: 'Pending 4%', c: '#ef4444' },
            ]).map((d: any) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color || d.c, flexShrink: 0 }} />
                <span style={{ color: '#64748b' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD_STYLE}>
          <ChartHeader title="Daily Billing Activity" sub="This week's billed vs collected amounts" />
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyBilling && dailyBilling.length > 0 ? dailyBilling : [
                  { day: 'Mon', Billed: 3800000, Collected: 3200000 },
                  { day: 'Tue', Billed: 4200000, Collected: 3700000 },
                  { day: 'Wed', Billed: 5100000, Collected: 4600000 },
                  { day: 'Thu', Billed: 4600000, Collected: 4100000 },
                  { day: 'Fri', Billed: 5800000, Collected: 5200000 },
                  { day: 'Sat', Billed: 2900000, Collected: 2700000 },
                  { day: 'Today', Billed: 4300000, Collected: 3100000 },
                ]}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`UGX ${(v / 1e6).toFixed(2)}M`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Billed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── HELPERS ─────────────────────────── */

function ChartHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.2rem' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
    </div>
  );
}

interface KpiProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  delta: string;
  up?: boolean;
  neutral?: boolean;
}

function KpiCard({ icon, color, label, value, delta, up, neutral }: KpiProps) {
  const deltaColor = neutral ? '#64748b' : up ? '#059669' : '#dc2626';
  return (
    <div style={{ ...CARD_STYLE, padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.3 }}>{label}</div>
        <div style={{ width: 34, height: 34, borderRadius: '0.6rem', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {React.cloneElement(icon as React.ReactElement, { style: { width: 16, height: 16 } })}
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: '0.4rem', fontSize: 11, fontWeight: 700, color: deltaColor }}>{neutral ? '' : up ? '▲ ' : '▼ '}{delta}</div>
    </div>
  );
}

function InventoryTab() {
  const [drugs, setDrugs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showAddStockModal, setShowAddStockModal] = React.useState<any>(null);
  
  // Add Drug State
  const [newDrug, setNewDrug] = React.useState({ name: '', strength: '', unit: 'Tablets', quantity: '0' });
  const [saving, setSaving] = React.useState(false);

  // Add Stock State
  const [stockQty, setStockQty] = React.useState('');
  const [stockSaving, setStockSaving] = React.useState(false);
  
  React.useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    try {
      const res = await fetch('/api/drugs');
      const data = await res.json();
      if(data.success) {
        setDrugs(data.drugs);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDrug, quantity: parseInt(newDrug.quantity) || 0 })
      });
      if(res.ok) {
        setShowAddModal(false);
        setNewDrug({ name: '', strength: '', unit: 'Tablets', quantity: '0' });
        loadDrugs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add drug');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!showAddStockModal) return;
    setStockSaving(true);
    try {
      const res = await fetch('/api/drugs/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugId: showAddStockModal.id, quantity: parseInt(stockQty) })
      });
      if(res.ok) {
        setShowAddStockModal(null);
        setStockQty('');
        loadDrugs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add stock');
      }
    } finally {
      setStockSaving(false);
    }
  };

  const handleToggleActive = async (drug: any) => {
    if(!window.confirm(`Are you sure you want to ${drug.is_active ? 'deactivate' : 'activate'} this drug?`)) return;
    try {
      const res = await fetch('/api/drugs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: drug.id, isActive: !drug.is_active })
      });
      if(res.ok) {
        loadDrugs();
      }
    } catch(err) {
      alert('Failed to update drug status');
    }
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div style={CARD_STYLE}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Drug Inventory</h2>
          <p className="text-muted text-sm">Manage institution medications and stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New Drug
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-3 text-sm text-gray-500 font-bold uppercase tracking-wider">Drug Name</th>
              <th className="p-3 text-sm text-gray-500 font-bold uppercase tracking-wider">Strength</th>
              <th className="p-3 text-sm text-gray-500 font-bold uppercase tracking-wider">Unit</th>
              <th className="p-3 text-sm text-gray-500 font-bold uppercase tracking-wider">Available Stock</th>
              <th className="p-3 text-sm text-gray-500 font-bold uppercase tracking-wider">Status</th>
              <th className="p-3 text-sm text-gray-500 font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drugs.map(drug => (
              <tr key={drug.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3 font-bold text-gray-800">{drug.name}</td>
                <td className="p-3 text-gray-600">{drug.strength || '—'}</td>
                <td className="p-3 text-gray-600">{drug.unit}</td>
                <td className="p-3">
                  <span className={`font-bold ${drug.quantity <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {drug.quantity.toLocaleString()}
                  </span>
                </td>
                <td className="p-3">
                  {drug.is_active ? 
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Active</span> : 
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Inactive</span>
                  }
                </td>
                <td className="p-3 text-right">
                  {drug.is_active && (
                    <button onClick={() => setShowAddStockModal(drug)} className="text-blue-600 font-bold text-sm mr-4 hover:underline">
                      + Stock
                    </button>
                  )}
                  <button onClick={() => handleToggleActive(drug)} className="text-gray-500 font-bold text-sm hover:underline">
                    {drug.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {drugs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No drugs found in inventory. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Add New Drug</h3>
            <form onSubmit={handleAddDrug}>
              <div className="mb-4">
                <label className="form-label">Drug Name *</label>
                <input required value={newDrug.name} onChange={e=>setNewDrug({...newDrug, name: e.target.value})} className="input-modern" placeholder="e.g. Paracetamol" />
              </div>
              <div className="mb-4">
                <label className="form-label">Strength (Optional)</label>
                <input value={newDrug.strength} onChange={e=>setNewDrug({...newDrug, strength: e.target.value})} className="input-modern" placeholder="e.g. 500mg" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Unit *</label>
                  <select required value={newDrug.unit} onChange={e=>setNewDrug({...newDrug, unit: e.target.value})} className="select-modern">
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Vials">Vials</option>
                    <option value="Sachets">Sachets</option>
                    <option value="Tubes">Tubes</option>
                    <option value="Packs">Packs</option>
                    <option value="Units">Units</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Initial Quantity</label>
                  <input type="number" min="0" value={newDrug.quantity} onChange={e=>setNewDrug({...newDrug, quantity: e.target.value})} className="input-modern" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Add Drug'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Add Stock</h3>
            <p className="text-sm text-gray-500 mb-4">{showAddStockModal.name} {showAddStockModal.strength}</p>
            <form onSubmit={handleAddStock}>
              <div className="mb-6">
                <label className="form-label">Quantity to Add</label>
                <input type="number" min="1" required value={stockQty} onChange={e=>setStockQty(e.target.value)} className="input-modern" placeholder="e.g. 100" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => {setShowAddStockModal(null); setStockQty('');}} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={stockSaving} className="btn btn-primary">{stockSaving ? 'Adding...' : 'Add Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
