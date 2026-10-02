import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { validateRequired, handleApiError } from '@/lib/validation';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequired(body, ['name', 'portalKey']);
    if (validation) return validation;

    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('name', body.name.trim())
      .eq('portal_key', body.portalKey.trim())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invalid institution credentials' }, { status: 401 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      institutionId: data.id,
      name: data.name,
      location: data.location,
    });
    return setSessionCookie(response, {
      staffId: null,
      name: data.name,
      role: 'admin',
      institutionId: data.id,
    });
  } catch (err) {
    return handleApiError(err, 'Failed to verify institution');
  }
}
