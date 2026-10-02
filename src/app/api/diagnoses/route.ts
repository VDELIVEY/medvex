import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['doctor']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const { episodeId, notes } = body;

    if (!episodeId || !notes || !auth.session.staffId) {
      return NextResponse.json({ error: 'Missing diagnosis details' }, { status: 400 });
    }

    const { data, error } = await supabase.from('diagnoses').insert([
      { episode_id: episodeId, doctor_id: auth.session.staffId, notes: notes.trim() }
    ]).select();

    if (error) {
      return NextResponse.json({ error: 'Failed to save diagnosis: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ mock: false, diagnosis: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save diagnosis' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = requireSession(request);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');

    if (!episodeId) {
      return NextResponse.json({ error: 'Episode ID required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('diagnoses').select('*').eq('episode_id', episodeId).order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ mock: false, diagnoses: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch diagnoses' }, { status: 500 });
  }
}

