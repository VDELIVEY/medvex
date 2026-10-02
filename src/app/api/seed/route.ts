import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Seed endpoint is disabled in production' }, { status: 404 });
    }
    const configuredSecret = process.env.MEDQR_SEED_SECRET;
    if (!configuredSecret || request.headers.get('x-seed-secret') !== configuredSecret) {
      return NextResponse.json({ error: 'Seed authorization required' }, { status: 401 });
    }
    const plainPassword = process.env.MEDQR_SEED_PASSWORD;
    if (!plainPassword || plainPassword.length < 12) {
      return NextResponse.json({ error: 'MEDQR_SEED_PASSWORD must be configured with at least 12 characters' }, { status: 500 });
    }
    if (!plainPassword || plainPassword.length < 12) {
      return NextResponse.json({ error: 'MEDQR_SEED_PASSWORD must be configured with at least 12 characters' }, { status: 500 });
    }

    // 1. Find or create default institution for the superadmin
    let inst = null;
    let instError = null;
    const instResult = await supabase
      .from('institutions')
      .select('id, name, portal_key')
      .eq('portal_key', 'MINISTRY-HQ-001')
      .single();

    if (instResult.error?.code === 'PGRST116') {
      const insertResult = await supabase
        .from('institutions')
        .insert([
          {
            name: 'Ministry of Health HQ',
            location: 'Central',
            owner: 'System Administrator',
            license_number: 'LIC-MOH-001',
            services: ['Administration', 'Oversight'],
            portal_key: 'MINISTRY-HQ-001',
            is_active: true,
          },
        ])
        .select()
        .single();
      inst = insertResult.data;
      instError = insertResult.error;
    } else {
      inst = instResult.data;
      instError = instResult.error;
    }

    if (instError || !inst) {
      return NextResponse.json(
        { error: 'Failed to prepare seed institution: ' + (instError?.message || 'unknown') },
        { status: 500 }
      );
    }

    // 2. Find or create superadmin staff record
    let staffRec = null;
    let staffError = null;
    const staffResult = await supabase
      .from('staff')
      .select('id, full_name')
      .eq('institution_id', inst.id)
      .eq('occupation', 'superadmin')
      .eq('is_active', true)
      .single();

    if (staffResult.error?.code === 'PGRST116') {
      const insertStaff = await supabase
        .from('staff')
        .insert([
          {
            institution_id: inst.id,
            full_name: 'System Administrator',
            age: 30,
            gender: 'Other',
            occupation: 'superadmin',
            is_active: true,
          },
        ])
        .select()
        .single();
      staffRec = insertStaff.data;
      staffError = insertStaff.error;
    } else {
      staffRec = staffResult.data;
      staffError = staffResult.error;
    }

    if (staffError || !staffRec) {
      return NextResponse.json(
        { error: 'Failed to prepare seed staff: ' + (staffError?.message || 'unknown') },
        { status: 500 }
      );
    }

    // 3. Find or create/update credentials
    const credCheck = await supabase
      .from('staff_credentials')
      .select('username')
      .eq('username', 'superadmin')
      .single();

    const passwordHash = await hashPassword(plainPassword);
    if (credCheck.data) {
      const { error: resetError } = await supabase
        .from('staff_credentials')
        .update({ password_hash: passwordHash, last_login: null, staff_id: staffRec.id })
        .eq('username', 'superadmin');
      if (resetError) {
        return NextResponse.json({ error: 'Failed to reset existing superadmin password' }, { status: 500 });
      }
      return NextResponse.json(
        { success: true, message: 'Existing development superadmin password reset successfully.', credentials: { username: 'superadmin' } },
        { status: 200 }
      );
    }

    const { error: credError } = await supabase
      .from('staff_credentials')
      .insert([
        {
          staff_id: staffRec.id,
          username: 'superadmin',
          password_hash: passwordHash,
        },
      ]);

    if (credError) {
      return NextResponse.json(
        { error: 'Failed to create seed credentials: ' + credError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Seed completed successfully.',
      credentials: { username: 'superadmin' },
      institution: {
        id: inst.id,
        name: inst.name,
        portal_key: inst.portal_key,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Seed failed: ' + err.message },
      { status: 500 }
    );
  }
}

