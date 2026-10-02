import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { validateInstitution, handleApiError } from '@/lib/validation';
import { generateCode } from '@/lib/auth';
import { requireSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const body = await request.formData();
    const validation = validateInstitution(body);
    if (validation) return validation;

    const name = (body.get('name') as string)?.trim();
    const location = (body.get('location') as string)?.trim();
    const owner = (body.get('owner') as string)?.trim();
    const license_number = body.get('license_number') as string;
    const servicesStr = (body.get('services') as string)?.trim();

    // Duplicate check
    const { data: existing } = await supabase
      .from('institutions')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Institution name already exists' }, { status: 409 });
    }

    const portal_key = generateCode('INST', 8);
    const servicesArray = servicesStr.split(',').map((s: string) => s.trim()).filter(Boolean);

    const { data, error } = await supabase.from('institutions').insert([{
      name,
      location,
      owner,
      license_number,
      services: servicesArray,
      portal_key
    }]).select();

    if (error) {
      return handleApiError(error, 'Failed to register institution');
    }

    return NextResponse.json({ success: true, institution: data[0], portal_key });
  } catch (err) {
    return handleApiError(err, 'Failed to register institution');
  }
}

export async function GET(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const { data, error } = await supabase.from('institutions').select('*');
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
    }
    return NextResponse.json({ institutions: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
  }
}
