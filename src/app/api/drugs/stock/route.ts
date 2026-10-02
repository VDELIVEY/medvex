import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { validateRequired, handleApiError } from '@/lib/validation';
import { requireSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'pharmacy', 'superadmin']);
    if (auth.response) return auth.response;
    
    const { searchParams } = new URL(request.url);
    const drugId = searchParams.get('drugId');

    if (!drugId) {
       return NextResponse.json({ error: 'drugId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*, staff:user_id(full_name)')
      .eq('drug_id', drugId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, transactions: data || [] });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch stock history');
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['admin', 'pharmacy', 'superadmin']);
    if (auth.response) return auth.response;
    
    const body = await request.json();
    const validation = validateRequired(body, ['drugId', 'quantity']);
    if (validation) return validation;

    const qty = parseInt(body.quantity);
    if (isNaN(qty) || qty <= 0) {
       return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });
    }

    // Use RPC to add stock safely
    const { data, error } = await supabase.rpc('add_drug_stock', {
      p_drug_id: body.drugId,
      p_add_qty: qty,
      p_staff_id: auth.session.staffId
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to add stock: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'Failed to add stock');
  }
}
