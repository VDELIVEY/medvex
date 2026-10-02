import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['doctor']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const { episodeId, testType } = body;

    if (!episodeId || !testType || !auth.session.staffId) {
      return NextResponse.json({ error: 'Missing test details' }, { status: 400 });
    }

    const { data, error } = await supabase.from('test_requests').insert([
      { episode_id: episodeId, doctor_id: auth.session.staffId, test_type: testType.trim(), paid: false }
    ]).select();

    if (error) {
      return NextResponse.json({ error: 'Failed to request test: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ mock: false, test: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to request test' }, { status: 500 });
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

    const { data, error } = await supabase.from('test_requests').select('*').eq('episode_id', episodeId).order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ mock: false, tests: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = requireSession(request, ['lab']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const { testId, results, labStaffId } = body;
    if (!testId || !results?.trim() || !auth.session.staffId) return NextResponse.json({ error: 'Test ID and results are required' }, { status: 400 });

    const { data, error } = await supabase.from('test_requests').update({ results: results.trim(), lab_staff_id: auth.session.staffId, status: 'completed', updated_at: new Date().toISOString() }).eq('id', testId).select();

    if (error) {
      return NextResponse.json({ error: 'Failed to update test results: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ mock: false, test: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update test results' }, { status: 500 });
  }
}

