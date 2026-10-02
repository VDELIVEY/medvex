import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { validateRequired, handleApiError } from '@/lib/validation';
import { requireSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['pharmacy', 'admin', 'superadmin']);
    if (auth.response) return auth.response;
    
    const body = await request.json();
    const validation = validateRequired(body, ['prescriptionId', 'quantity']);
    if (validation) return validation;

    const qty = parseInt(body.quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('dispense_prescription', {
      p_prescription_id: body.prescriptionId,
      p_dispense_qty: qty,
      p_staff_id: auth.session.staffId
    });

    if (error) {
      return NextResponse.json({ error: 'Dispensing failed: ' + error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, result: data }, { status: 200 });
  } catch (err) {
    return handleApiError(err, 'Failed to dispense prescription');
  }
}
