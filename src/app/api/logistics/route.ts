import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';

// ── Mock data for the demo meeting ──────────────────────────────────────────
// Replace with real analytics queries when data is available in production.
const MOCK_DISEASE_TRENDS = [
  { name: 'Jan', Malaria: 42, Typhoid: 18, Flu: 55 },
  { name: 'Feb', Malaria: 58, Typhoid: 24, Flu: 70 },
  { name: 'Mar', Malaria: 75, Typhoid: 31, Flu: 48 },
  { name: 'Apr', Malaria: 90, Typhoid: 27, Flu: 62 },
  { name: 'May', Malaria: 110, Typhoid: 35, Flu: 80 },
  { name: 'Jun', Malaria: 95, Typhoid: 22, Flu: 91 },
];

const MOCK_DRUG_DISTRIBUTION = [
  { region: 'Central', Antibiotics: 1240, Painkillers: 870, Antimalarial: 640 },
  { region: 'Eastern', Antibiotics: 780, Painkillers: 560, Antimalarial: 920 },
  { region: 'Northern', Antibiotics: 540, Painkillers: 420, Antimalarial: 1100 },
  { region: 'Western', Antibiotics: 670, Painkillers: 310, Antimalarial: 750 },
  { region: 'Kampala', Antibiotics: 1850, Painkillers: 1420, Antimalarial: 390 },
];

export async function GET(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;

    // Fetch real institution data for the Providers table
    const { data: institutions, error: iError } = await supabase.from('institutions').select('*');
    // Fetch real episode count for today
    const { data: episodes, error: eError } = await supabase.from('episodes').select('id, created_at');
    // Fetch real citizen count
    const { data: patients, error: pError } = await supabase.from('patients').select('id');
    // Fetch real dispensed count
    const { data: dispensed, error: dError } = await supabase.from('prescriptions').select('id').eq('dispensed', true);

    const totalCitizens = pError ? 4820 : (patients?.length ?? 4820);
    const totalInstitutions = iError ? 38 : (institutions?.length ?? 38);
    const activeEpisodesToday = eError ? 127 : (
      episodes?.filter((e: any) => new Date(e.created_at).toDateString() === new Date().toDateString()).length ?? 127
    );
    const drugsDispensed = dError ? 3241 : (dispensed?.length ?? 3241);

    // Use mock institutions list if DB is empty or errored
    const recentInstitutions = (institutions && institutions.length > 0)
      ? institutions.slice(0, 6)
      : [
          { id: 'mock-1', name: 'Mulago National Referral Hospital', location: 'Kampala, Central', services: ['Emergency', 'Surgery', 'Pediatrics'] },
          { id: 'mock-2', name: 'Entebbe General Hospital', location: 'Entebbe, Central', services: ['General', 'Maternity', 'Lab'] },
          { id: 'mock-3', name: 'Gulu Regional Hospital', location: 'Gulu, Northern', services: ['General', 'Malaria', 'TB'] },
          { id: 'mock-4', name: 'Mbarara University Teaching Hospital', location: 'Mbarara, Western', services: ['Teaching', 'Surgery', 'Oncology'] },
          { id: 'mock-5', name: 'Jinja Referral Hospital', location: 'Jinja, Eastern', services: ['Emergency', 'Dialysis', 'General'] },
        ];

    return NextResponse.json({
      success: true,
      data: {
        mock: true,
        totalCitizens,
        totalInstitutions,
        activeEpisodesToday,
        drugsDispensed,
        diseaseTrends: MOCK_DISEASE_TRENDS,
        drugDistribution: MOCK_DRUG_DISTRIBUTION,
        recentInstitutions,
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to fetch logistics' }, { status: 500 });
  }
}
