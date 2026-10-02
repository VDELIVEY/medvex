import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { comparePassword } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    // Fetch credentials + staff info in one query
    const { data: cred, error: credError } = await supabase
      .from('staff_credentials')
      .select('id, password_hash, last_login, staff(id, full_name, occupation, institution_id, is_active, institutions(name))')
      .eq('username', username.trim())
      .single();

    if (credError || !cred) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password
    const valid = await comparePassword(password, cred.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Update last_login
    await supabase
      .from('staff_credentials')
      .update({ last_login: new Date().toISOString() })
      .eq('id', cred.id);

    const staff = cred.staff as any;
    if (!staff || staff.is_active === false) {
      return NextResponse.json({ error: 'This staff account is inactive' }, { status: 403 });
    }

    const response = NextResponse.json({
      staffId: staff.id,
      name: staff.full_name,
      role: staff.occupation,
      institutionId: staff.institution_id,
      institutionName: staff.institutions?.name || null,
    });
    return setSessionCookie(response, {
      staffId: staff.id,
      name: staff.full_name,
      role: staff.occupation,
      institutionId: (staff.occupation === 'superadmin' || staff.occupation === 'ministry') ? null : staff.institution_id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Login failed: ' + err.message }, { status: 500 });
  }
}
