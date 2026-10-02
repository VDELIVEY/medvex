'use client';

import React, { useEffect, useState } from 'react';

type StaffMetricsProps = {
  institutionId: string | null;
};

export default function StaffMetrics({ institutionId }: StaffMetricsProps) {
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [activeDoctorsToday, setActiveDoctorsToday] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        // Current API GET /api/staff returns staff list.
        const res = await fetch('/api/staff');
        const json = await res.json();

        const staff = (json?.staff ?? []) as Array<{ institution_id?: string; occupation?: string }>;

        const filtered = institutionId
          ? staff.filter((s) => s.institution_id === institutionId)
          : staff;

        const total = filtered.length;
        // No dedicated “active doctors today” field exists in DB/API yet,
        // so we approximate by counting doctors in staff.
        const doctors = filtered.filter((s) => s.occupation === 'doctor').length;

        if (!cancelled) {
          setTotalStaff(total);
          setActiveDoctorsToday(doctors);
        }
      } catch {
        if (!cancelled) {
          setTotalStaff(0);
          setActiveDoctorsToday(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-border-color">
        <span className="font-semibold text-gray-700">Total Staff</span>
        <span className="text-2xl font-black text-primary">{loading ? '—' : totalStaff}</span>
      </div>

      <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-border-color">
        <span className="font-semibold text-gray-700">Active Doctors Today</span>
        <span className="text-2xl font-black" style={{ color: 'var(--secondary)' }}>
          {loading ? '—' : activeDoctorsToday}
        </span>

      </div>
    </div>
  );
}

