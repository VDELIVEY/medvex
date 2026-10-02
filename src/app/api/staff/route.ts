import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { requireSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const { fullName, age, gender, occupation, doctorServices, institutionId: requestedInstitutionId, username, password } = body;
    const institutionId = auth.session.institutionId || requestedInstitutionId;

    if (!fullName || !age || !gender || !occupation || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create Staff Record
    const { data: staffData, error: staffError } = await supabase.from('staff').insert([
      {
        institution_id: institutionId,
        full_name: fullName,
        age: parseInt(age),
        gender,
        occupation,
        doctor_services: occupation === 'doctor' ? doctorServices || [] : null,
      }
    ]).select();

    if (staffError || !staffData?.[0]) {
      return NextResponse.json({ error: staffError?.message || 'Failed to create staff record' }, { status: 500 });
    }

    const staffId = staffData[0].id;

    // 2. Create Credentials
    const passwordHash = await hashPassword(password);
    const { error: credError } = await supabase.from('staff_credentials').insert([
      {
        staff_id: staffId,
        username,
        password_hash: passwordHash,
      }
    ]);

    if (credError) {
      // Cleanup staff record if credential creation fails
      await supabase.from('staff').delete().eq('id', staffId);
      return NextResponse.json({ error: 'Username already exists or failed to create credentials' }, { status: 409 });
    }

    return NextResponse.json({ success: true, staff: staffData[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to register staff' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'ministry', 'superadmin', 'receptionist']);
    if (auth.response) return auth.response;
    let query = supabase.from('staff').select('id, full_name, occupation, doctor_services, is_active, institution_id');
    // Receptionists can only see staff from their own institution
    if (auth.session.institutionId) {
      query = query.eq('institution_id', auth.session.institutionId);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ mock: true, staff: [] });
    }
    return NextResponse.json({ mock: false, staff: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

