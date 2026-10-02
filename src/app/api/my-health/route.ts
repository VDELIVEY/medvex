import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { verifyPatientPin } from '@/lib/patient-pin';

/**
 * Public endpoint — no staff session required.
 * POST /api/my-health
 * Body: { qr: string, pin: string }
 * Returns the full patient record (citizen + episodes + diagnoses + prescriptions)
 * after verifying the patient's own security PIN.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qr, pin } = body;

    if (!qr || !pin) {
      return NextResponse.json({ error: 'QR code and PIN are required.' }, { status: 400 });
    }

    // 1. Look up citizen by QR code
    const { data: citizen, error: citizenErr } = await supabase
      .from('patients')
      .select('*')
      .eq('qr_code', qr.trim())
      .single();

    if (citizenErr || !citizen) {
      return NextResponse.json({ error: 'QR code not found in the national health registry.' }, { status: 404 });
    }

    // 2. Verify PIN
    const pinResult = await verifyPatientPin(citizen.id, pin);
    if (!pinResult.success) {
      return NextResponse.json({ error: 'Incorrect security PIN. Please try again.' }, { status: 401 });
    }

    // 3. Fetch episodes
    const { data: episodes, error: epErr } = await supabase
      .from('episodes')
      .select('id, episode_code, status, created_at, institution_id, institutions(name)')
      .eq('patient_id', citizen.id)
      .order('created_at', { ascending: false });

    if (epErr) {
      return NextResponse.json({ error: 'Failed to load medical history.' }, { status: 500 });
    }

    // 4. Fetch diagnoses & prescriptions for each episode (up to 20)
    const recentEpisodes = (episodes || []).slice(0, 20);
    const episodeDetails = await Promise.all(
      recentEpisodes.map(async (ep: any) => {
        const [diagRes, presRes, testRes] = await Promise.all([
          supabase.from('diagnoses').select('notes, created_at').eq('episode_id', ep.id),
          supabase.from('prescriptions').select('medication, dosage, instructions, dispensed').eq('episode_id', ep.id),
          supabase.from('tests').select('test_type, results, created_at').eq('episode_id', ep.id),
        ]);
        return {
          episodeId: ep.id,
          diagnoses: diagRes.data || [],
          prescriptions: presRes.data || [],
          tests: testRes.data || [],
        };
      })
    );

    const detailsMap: Record<string, any> = {};
    for (const d of episodeDetails) {
      detailsMap[d.episodeId] = d;
    }

    return NextResponse.json({
      success: true,
      citizen: {
        id: citizen.id,
        qr_code: citizen.qr_code,
        first_name: citizen.first_name,
        last_name: citizen.last_name,
        dob: citizen.dob,
        gender: citizen.gender,
        blood_type: citizen.blood_type,
        underlying_conditions: citizen.underlying_conditions,
        medical_history: citizen.medical_history,
        allergies: citizen.allergies,
      },
      episodes: recentEpisodes,
      episodeDetails: detailsMap,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
