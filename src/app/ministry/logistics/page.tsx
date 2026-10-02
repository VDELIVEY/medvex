"use client";

import React, { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Pill, Users, Building2, Map, 
  Activity, ArrowUpRight, AlertTriangle, Loader2 
} from "lucide-react";

import Breadcrumbs from "@/components/Breadcrumbs";

interface LogisticsData {
  totalCitizens: number;
  totalInstitutions: number;
  activeEpisodesToday: number;
  drugsDispensed: number;
  diseaseTrends: any[];
  drugDistribution: any[];
  recentInstitutions: any[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function LogisticsDashboard() {
  return (
    <RoleGuard allowedRole={["ministry", "superadmin"]}>
      <LogisticsContent />
    </RoleGuard>
  );
}

function LogisticsContent() {
  const [data, setData] = useState<LogisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/logistics")
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error || "Failed to load");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper flex-col items-center justify-center fade-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted font-medium pulse">Aggregating national health data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-8 fade-in">
        <div className="alert-modern alert-error flex items-center gap-4">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <h3 className="text-lg font-bold">System Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Ministry', href: '/ministry' }, { label: 'National Health Logistics' }]}
        backHref="/ministry"
        backLabel="Dashboard"
      />

      <div className="container p-8 fade-in">
        {/* Header */}
        <div className="page-header-banner flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="page-header-title">National Health Logistics</h1>
            <p className="page-header-subtitle">Ministry of Health Real-time Monitoring, Disease Tracking & Supply Chain Analytics</p>
          </div>
          <div className="bg-white/20 backdrop-blur px-5 py-2.5 rounded-2xl border border-white/20 shadow-sm flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full pulse"></div>
            <span className="font-semibold text-white text-sm">Live Data Sync Active</span>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard 
          icon={<TrendingUp className="w-6 h-6 text-primary" />} 
          label="Registered Citizens" 
          value={data?.totalCitizens?.toLocaleString() || '—'} 
          trend="up"
          subLabel="national registry"
        />
        <MetricCard 
          icon={<Pill className="w-6 h-6 text-green-500" />} 
          label="Drugs Dispensed" 
          value={data?.drugsDispensed?.toLocaleString() || '—'} 
          trend="up"
          subLabel="all time"
        />
        <MetricCard 
          icon={<Users className="w-6 h-6 text-amber-500" />} 
          label="Healthcare Facilities" 
          value={data?.totalInstitutions?.toLocaleString() || '—'} 
          trend="up"
          subLabel="registered"
        />
        <MetricCard 
          icon={<Activity className="w-6 h-6 text-red-500" />} 
          label="Active Episodes Today" 
          value={data?.activeEpisodesToday?.toLocaleString() || '0'} 
          trend="up"
          subLabel="live monitoring"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Disease Trends Line Chart */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="m-0 flex items-center gap-3">
              <TrendingUp className="text-primary" /> Disease Prevalence Trends
            </h3>
              <select className="bg-transparent border-none font-semibold text-primary outline-none" disabled>
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.diseaseTrends || []}>
                <defs>
                  <linearGradient id="colorMalaria" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTyphoid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Area type="monotone" dataKey="Malaria" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorMalaria)" />
                <Area type="monotone" dataKey="Typhoid" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTyphoid)" />
                <Area type="monotone" dataKey="Flu" stroke="#10b981" strokeWidth={3} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drug Distribution Bar Chart */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="m-0 flex items-center gap-3">
              <Map className="text-secondary" /> Drug Distribution by Region
            </h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.drugDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(14, 165, 233, 0.05)'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="rect" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Antibiotics" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Painkillers" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Antimalarial" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="grid grid-cols-1 gap-8">
        <div className="glass-card p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h3 className="m-0 flex items-center gap-3">
              <Building2 className="text-primary" /> Registered Healthcare Providers
            </h3>
            <div className="flex gap-2">
              <button className="btn btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}>Export CSV</button>
              <button className="btn btn-secondary" style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}>Filter List</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-color">
                  <th className="pb-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Institution</th>
                  <th className="pb-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Location</th>
                  <th className="pb-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Services</th>
                  <th className="pb-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {data?.recentInstitutions.map((inst, i) => (
                  <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5">
                      <div className="font-bold text-gray-900">{inst.name}</div>
                      <div className="text-xs text-muted">ID: {inst.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-5 text-gray-600 font-medium">{inst.location}</td>
                    <td className="py-5">
                      <div className="flex flex-wrap gap-1">
                        {inst.services.slice(0, 3).map((s: string, j: number) => (
                          <span key={j} className="text-[10px] bg-blue-50 text-primary px-2 py-0.5 rounded-full font-bold border border-blue-100 uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="badge-modern badge-primary">Operational</div>
                    </td>
                    <td className="py-5 text-right">
                      <button className="p-2 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, subLabel }: any) {
  return (
    <div className="glass-card p-6 flex items-start justify-between group hover:-translate-y-1 transition-all duration-300">
      <div>
        <p className="text-sm font-bold text-muted uppercase tracking-widest mb-1">{label}</p>
        <div className="text-3xl font-black text-gray-900 mb-2">{value}</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'} {subLabel}
          </span>
        </div>
      </div>
      <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
  );
}
