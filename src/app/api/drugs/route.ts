import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { validateRequired, handleApiError } from '@/lib/validation';
import { requireSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const auth = requireSession(request);
    if (auth.response) return auth.response;
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = supabase
      .from('drugs')
      .select('*')
      .eq('institution_id', auth.session.institutionId)
      .order('name', { ascending: true });
      
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, drugs: data || [] });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch drugs');
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'pharmacy', 'superadmin']);
    if (auth.response) return auth.response;
    
    const body = await request.json();
    const validation = validateRequired(body, ['name', 'unit', 'quantity']);
    if (validation) return validation;

    // We do an insert and then immediately insert into stock_transactions manually
    // Or we could do it in a transaction but we'll do it sequentially here.
    
    const { data: drug, error: drugErr } = await supabase
      .from('drugs')
      .insert([
        {
          institution_id: auth.session.institutionId,
          name: body.name.trim(),
          strength: body.strength?.trim() || null,
          unit: body.unit.trim(),
          quantity: parseInt(body.quantity) || 0,
        },
      ])
      .select()
      .single();

    if (drugErr) {
      return NextResponse.json({ error: 'Failed to add drug: ' + drugErr.message }, { status: 500 });
    }
    
    // Add initial stock transaction if quantity > 0
    if (drug.quantity > 0) {
      await supabase.from('stock_transactions').insert([{
        drug_id: drug.id,
        type: 'Initial Stock',
        quantity: drug.quantity,
        previous_quantity: 0,
        new_quantity: drug.quantity,
        user_id: auth.session.staffId
      }]);
    }

    return NextResponse.json({ success: true, drug }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'Failed to add drug');
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'pharmacy', 'superadmin']);
    if (auth.response) return auth.response;
    
    const body = await request.json();
    const validation = validateRequired(body, ['id']);
    if (validation) return validation;
    
    const updates: any = {};
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.name !== undefined) updates.name = body.name;
    if (body.strength !== undefined) updates.strength = body.strength;
    if (body.unit !== undefined) updates.unit = body.unit;

    const { data, error } = await supabase
      .from('drugs')
      .update(updates)
      .eq('id', body.id)
      .eq('institution_id', auth.session.institutionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update drug: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, drug: data });
  } catch (err) {
    return handleApiError(err, 'Failed to update drug');
  }
}
