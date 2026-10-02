import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { validateRequired, validateEnum, handleApiError } from '@/lib/validation';
import { generateCode } from '@/lib/auth';
import { requireSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['receptionist', 'admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const validation = validateRequired(body, ['patientId']);
    if (validation) return validation;
    const institutionId = auth.session.institutionId || body.institutionId;
    if (!institutionId) return NextResponse.json({ error: 'Institution context is required' }, { status: 400 });

    const episode_code = generateCode('EP', 6);

    const { data, error } = await supabase
      .from('episodes')
      .insert([
        {
          episode_code,
          patient_id: body.patientId,
          institution_id: institutionId,
          status: 'created',
          receptionist_id: auth.session.staffId,
          assigned_doctor_id: body.assignedDoctorId || null,
          chief_complaint: body.chiefComplaint || null,
        },
      ])
      .select('*, patients(*), institutions(*)')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create episode: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, episode: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'Failed to create episode');
  }
}

export async function GET(request: Request) {
  try {
    const auth = requireSession(request);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const name = searchParams.get('name');
    const patientId = searchParams.get('patientId');
    const institutionId = searchParams.get('institutionId');
    const assignedDoctorId = searchParams.get('assignedDoctorId');
    const status = searchParams.get('status');

    if (code) {

      const { data, error } = await supabase
        .from('episodes')
        .select('*, patients(*), institutions(*)')
        .eq('episode_code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
      }
      if (auth.session.institutionId && data.institution_id !== auth.session.institutionId) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, episode: data });
    }

    if (name) {
      let nameQuery = supabase
        .from('episodes')
        .select('*, patients!inner(*), institutions(*)')
        .or(`first_name.ilike.%${name.replace(/[(),.%]/g, '')}%,last_name.ilike.%${name.replace(/[(),.%]/g, '')}%`, { foreignTable: 'patients' })
        .order('created_at', { ascending: false });
      if (auth.session.institutionId) nameQuery = nameQuery.eq('institution_id', auth.session.institutionId);
      const { data, error } = await nameQuery;

      if (error) {
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, episodes: data || [] });
    }

    const date = searchParams.get('date');

    let query = supabase
      .from('episodes')
      .select('*, patients(*), institutions(*)')
      .order('created_at', { ascending: false });

    if (patientId) query = query.eq('patient_id', patientId);
    if (institutionId) query = query.eq('institution_id', institutionId);
    if (auth.session.institutionId) query = query.eq('institution_id', auth.session.institutionId);
    if (assignedDoctorId) query = query.eq('assigned_doctor_id', assignedDoctorId);
    if (status) query = query.eq('status', status);

    // Optional filter: date=today (local server time)
    if (date === 'today') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
    }

    const { data, error } = await query;


    if (error) {
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, episodes: data || [] });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch episodes');
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = requireSession(request, ['doctor', 'lab', 'pharmacy', 'cashier', 'admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const validation = validateRequired(body, ['episodeId', 'status']);
    if (validation) return validation;

    const validStatuses = [
      'created', 'in_consultation', 'waiting_lab',
      'lab_results_ready', 'waiting_pharmacy_payment', 'prescription_ready',
      'completed', 'cancelled',
    ];
    const statusErr = validateEnum(body.status, 'status', validStatuses);
    if (statusErr) return statusErr;

    const { data: current, error: currentError } = await supabase.from('episodes').select('status, institution_id').eq('id', body.episodeId).single();
    if (currentError || !current) return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    if (auth.session.institutionId && current.institution_id !== auth.session.institutionId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const transitions: Record<string, string[]> = {
      created: ['in_consultation', 'cancelled'],
      in_consultation: ['waiting_lab', 'lab_results_ready', 'prescription_ready', 'completed', 'cancelled'],
      waiting_lab: ['lab_results_ready', 'cancelled'],
      lab_results_ready: ['in_consultation', 'prescription_ready', 'completed', 'cancelled'],
      prescription_ready: ['completed', 'cancelled'],
      waiting_pharmacy_payment: ['completed', 'cancelled'],
      completed: ['completed'],
      cancelled: ['cancelled'],
    };
    if (!transitions[current.status]?.includes(body.status)) return NextResponse.json({ error: `Invalid episode transition from ${current.status} to ${body.status}` }, { status: 409 });

    const updates: Record<string, any> = { status: body.status };
    if (body.assignedDoctorId) updates.assigned_doctor_id = body.assignedDoctorId;
    if (body.referralNote !== undefined) updates.referral_note = body.referralNote;

    const { data, error } = await supabase
      .from('episodes')
      .update(updates)
      .eq('id', body.episodeId)
      .select('*, patients(*), institutions(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update episode: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, episode: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update episode: ' + err.message }, { status: 500 });
  }
}
