import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';
import { generateCode } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = requireSession(request);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    const institutionId = searchParams.get('institutionId');

    let query = supabase.from('payments').select('*, episodes(institution_id)');
    if (episodeId) query = query.eq('episode_id', episodeId);
    if (institutionId) query = query.eq('episodes.institution_id', institutionId);
    if (auth.session.institutionId) query = query.eq('episodes.institution_id', auth.session.institutionId);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ mock: false, payments: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireSession(request, ['cashier', 'admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const body = await request.json();
    const { episodeId, amount, method, type, description } = body;

    if (!episodeId || amount === undefined || !method || !type) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }
    if (!['consultation', 'lab', 'pharmacy', 'referral', 'other'].includes(type)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }
    if (!['cash', 'mobile', 'card', 'insurance', 'waived'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    if (method !== 'cash') {
      return NextResponse.json({ error: 'Only cash received at the cashier can be recorded here. Use the payment provider for mobile or card payments.' }, { status: 409 });
    }
    if (body.cashReceived !== true) {
      return NextResponse.json({ error: 'Confirm that the cash has physically been received before recording payment.' }, { status: 400 });
    }

    const { data: episode, error: episodeError } = await supabase.from('episodes').select('id, institution_id, status').eq('id', episodeId).single();
    if (episodeError || !episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    if (auth.session.institutionId && episode.institution_id !== auth.session.institutionId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (type === 'consultation' && episode.status !== 'created') {
      return NextResponse.json({ error: 'This episode is not awaiting consultation payment' }, { status: 409 });
    }
    if (type === 'consultation') {
      const { data: pendingPayment, error: pendingError } = await supabase
        .from('payments')
        .select('id')
        .eq('episode_id', episodeId)
        .eq('type', 'consultation')
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();
      if (pendingError) return NextResponse.json({ error: 'Unable to check payment status' }, { status: 500 });
      if (pendingPayment) return NextResponse.json({ error: 'A provider payment is already pending. Verify or cancel it before recording another payment.' }, { status: 409 });
    }

    const paymentPayload: any = {
      episode_id: episodeId,
      amount: numericAmount,
      method,
      type,
      cashier_id: auth.session.staffId,
      receipt_number: generateCode('RCT', 10),
      status: 'completed',
      verified_at: new Date().toISOString(),
      notes: description || null,
    };

    const { data: payment, error: paymentError } = await supabase.from('payments').insert(paymentPayload).select().single();
    if (paymentError) return NextResponse.json({ error: 'Payment processing failed: ' + paymentError.message }, { status: 500 });

    if (type === 'consultation' && episode.status === 'created') {
      const { error: episodeUpdateError } = await supabase
        .from('episodes')
        .update({ status: 'in_consultation' })
        .eq('id', episodeId)
        .eq('status', 'created');
      if (episodeUpdateError) {
        console.error('Cash payment recorded but episode could not advance:', episodeUpdateError);
        return NextResponse.json({ error: 'Cash payment recorded, but episode status could not be updated. Contact an administrator.' }, { status: 500 });
      }
    }

    return NextResponse.json({ mock: false, payment, status: episode.status }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}