import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const auth = requireSession(request, ['pharmacy', 'admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    const code = searchParams.get('code');

    // Detail view: diagnoses + prescriptions for a specific episode
    if (episodeId) {
      const [diagnosesRes, prescriptionsRes] = await Promise.all([
        supabase.from('diagnoses').select('*').eq('episode_id', episodeId),
        supabase.from('prescriptions').select('*').eq('episode_id', episodeId),
      ]);

      if (diagnosesRes.error || prescriptionsRes.error) {
        return NextResponse.json({ error: 'Database error while fetching episode details' }, { status: 500 });
      }

      return NextResponse.json({
        mock: false,
        diagnoses: diagnosesRes.data || [],
        prescriptions: prescriptionsRes.data || [],
      });
    }

    // List view: episodes that have at least one prescription where not all dispensed
    // We use a subquery approach: get episode_ids from undispensed prescriptions, then fetch those episodes
    let query = supabase
      .from('prescriptions')
      .select('episode_id, episodes!inner(*, patients(*))')
      .not('dispensed', 'eq', true);

    if (code) {
      query = query.ilike('episodes.episode_code', `%${code}%`);
    }

    if (auth.session.institutionId) query = query.eq('episodes.institution_id', auth.session.institutionId);

    const { data: prescriptionData, error: prescriptionError } = await query;

    if (prescriptionError) {
      return NextResponse.json({ error: 'Database error while fetching pharmacy queue' }, { status: 500 });
    }

    // Deduplicate episodes by episode_id
    const seen = new Set<string>();
    const episodes = (prescriptionData || [])
      .map((row: any) => row.episodes)
      .filter((ep: any) => {
        if (!ep || seen.has(ep.id)) return false;
        seen.add(ep.id);
        return true;
      });

    return NextResponse.json({ mock: false, episodes });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch pharmacy data' }, { status: 500 });
  }
}

