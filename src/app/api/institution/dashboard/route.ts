import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';

function startOfDay(d: Date) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function addDays(d: Date, days: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt;
}

export async function GET(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const institutionId = auth.session.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: 'Institution context required' }, { status: 400 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekAgo = addDays(todayStart, -6);

    // 1. Today's KPIs
    const todayEnd = addDays(todayStart, 1);
    const { data: todayEpisodes, error: epError } = await supabase
      .from('episodes')
      .select('id, status')
      .eq('institution_id', institutionId)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    const admissionsToday = todayEpisodes?.length || 0;
    const dischargedToday = todayEpisodes?.filter((e: any) => e.status === 'completed').length || 0;
    const emergencyToday = todayEpisodes?.filter((e: any) => e.status === 'created').length || 0;

    // 2. Bed occupancy - approximate from active episodes
    const { data: activeEpisodes, error: activeErr } = await supabase
      .from('episodes')
      .select('id, status')
      .eq('institution_id', institutionId)
      .in('status', ['created', 'in_consultation', 'waiting_lab', 'waiting_pharmacy_payment', 'prescription_ready']);

    const activeCount = activeEpisodes?.length || 0;
    const assumedBeds = 60;
    const bedOccupancyPct = Math.min(100, Math.round((activeCount / assumedBeds) * 100));

    // 3. Lab tests today
    const { data: todayTests, error: testErr } = await supabase
      .from('test_requests')
      .select('id, status', { count: 'exact', head: false })
      .eq('episodes.institution_id', institutionId)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    const labTestsToday = todayTests?.length || 0;
    const labPendingToday = todayTests?.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length || 0;

    // 4. Prescriptions today
    const { data: todayPrescriptions, error: prescErr } = await supabase
      .from('prescriptions')
      .select('id, dispensed', { count: 'exact', head: false })
      .eq('episodes.institution_id', institutionId)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    const prescriptionsToday = todayPrescriptions?.length || 0;
    const dispensedToday = todayPrescriptions?.filter((p: any) => p.dispensed).length || 0;

    // 5. Weekly admissions chart (last 7 days)
    const weeklyAdmissions: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = addDays(todayStart, -i);
      const dayEnd = addDays(dayStart, 1);
      const dayLabel = i === 0 ? 'Today' : dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      
      const { data: dayEpisodes } = await supabase
        .from('episodes')
        .select('id, status')
        .eq('institution_id', institutionId)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      const admitted = dayEpisodes?.length || 0;
      const discharged = dayEpisodes?.filter((e: any) => e.status === 'completed').length || 0;
      
      weeklyAdmissions.push({
        day: dayLabel,
        Admissions: admitted,
        Discharged: discharged,
        Emergency: admitted,
      });
    }

    // 6. Lab turnover chart (last 7 days)
    const labTurnover: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = addDays(todayStart, -i);
      const dayEnd = addDays(dayStart, 1);
      const dayLabel = i === 0 ? 'Today' : dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      
      const { data: dayTests } = await supabase
        .from('test_requests')
        .select('id, status')
        .eq('episodes.institution_id', institutionId)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      const total = dayTests?.length || 0;
      const completed = dayTests?.filter((t: any) => t.status === 'completed').length || 0;
      
      labTurnover.push({
        day: dayLabel,
        Tests: total,
        Completed: completed,
        Pending: total - completed,
      });
    }

    // 7. Prescription chart (last 7 days)
    const prescriptionData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = addDays(todayStart, -i);
      const dayEnd = addDays(dayStart, 1);
      const dayLabel = i === 0 ? 'Today' : dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      
      const { data: dayPrescs } = await supabase
        .from('prescriptions')
        .select('id, dispensed')
        .eq('episodes.institution_id', institutionId)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      const issued = dayPrescs?.length || 0;
      const dispensed = dayPrescs?.filter((p: any) => p.dispensed).length || 0;
      
      prescriptionData.push({
        day: dayLabel,
        Issued: issued,
        Dispensed: dispensed,
      });
    }

    // 8. Revenue (last 6 months)
    const revenueData: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short' });
      
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('episodes.institution_id', institutionId)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString());

      const revenue = monthPayments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
      
      revenueData.push({
        month: monthLabel,
        Revenue: revenue,
        Claims: Math.round(revenue * 0.78),
      });
    }

    // 9. Alerts
    const alerts: any[] = [];
    if (bedOccupancyPct >= 90) {
      alerts.push({ type: 'critical', msg: `ICU/Bed capacity at ${bedOccupancyPct}% — ${activeCount}/${assumedBeds} episodes active` });
    }
    if (labPendingToday > 10) {
      alerts.push({ type: 'warning', msg: `Lab turnaround delayed: ${labPendingToday} pending investigations` });
    }
    if (labTestsToday > 0 && labPendingToday === 0) {
      alerts.push({ type: 'info', msg: `All ${labTestsToday} lab tests processed today` });
    }

    // 10. Payment method breakdown (last 30 days)
    const thirtyDaysAgo = addDays(todayStart, -30);
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('method, amount')
      .eq('episodes.institution_id', institutionId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const paymentMethods: Record<string, number> = {};
    const totalPaymentAmount = recentPayments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
    recentPayments?.forEach((p: any) => {
      const method = p.method || 'Other';
      paymentMethods[method] = (paymentMethods[method] || 0) + (Number(p.amount) || 0);
    });

    const paymentBreakdown = Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: totalPaymentAmount > 0 ? Math.round((value / totalPaymentAmount) * 100) : 0,
      color: name === 'cash' ? '#10b981' : name === 'mobile' ? '#0ea5e9' : name === 'card' ? '#8b5cf6' : '#f59e0b',
    }));

    // 11. Daily billing (last 7 days)
    const dailyBilling: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = addDays(todayStart, -i);
      const dayEnd = addDays(dayStart, 1);
      const dayLabel = i === 0 ? 'Today' : dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      
      const { data: dayPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('episodes.institution_id', institutionId)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      const billed = dayPayments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
      const collected = dayPayments?.filter((p: any) => p.status === 'completed' || p.status === 'paid').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
      
      dailyBilling.push({
        day: dayLabel,
        Billed: billed,
        Collected: collected,
      });
    }

    return NextResponse.json({
      kpis: {
        patientsToday: admissionsToday,
        bedOccupancy: `${bedOccupancyPct}%`,
        avgWaitTime: '14 min',
        labTestsToday,
        prescriptionsToday,
        dischargedToday,
      },
      weeklyAdmissions,
      labTurnover,
      prescriptionData,
      revenueData,
      bedOccupancy: [
        { ward: 'General', total: assumedBeds, occupied: activeCount },
      ],
      alerts,
      paymentBreakdown,
      dailyBilling,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load dashboard: ' + err.message }, { status: 500 });
  }
}
