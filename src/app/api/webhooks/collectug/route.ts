import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { transaction_id, status, merchant_reference, amount, phone_number } = payload;
    if (!transaction_id || !merchant_reference || !status) return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    const normalizedStatus = status === 'completed' ? 'completed' : ['failed', 'cancelled'].includes(status) ? status : 'pending';
    const { data: payment, error } = await supabase.from('payments').select('id, episode_id, amount').eq('merchant_reference', merchant_reference).maybeSingle();
    if (error) return NextResponse.json({ error: 'Webhook lookup failed' }, { status: 500 });
    if (!payment) return NextResponse.json({ success: true, message: 'Webhook acknowledged' }, { status: 200 });
    if (amount !== undefined && Number(amount) !== Number(payment.amount)) return NextResponse.json({ error: 'Webhook amount mismatch' }, { status: 400 });
    const { error: updateError } = await supabase.from('payments').update({ status: normalizedStatus, transaction_id, phone_number: phone_number || null, provider_response: payload }).eq('id', payment.id);
    if (updateError) return NextResponse.json({ error: 'Webhook update failed' }, { status: 500 });
    if (normalizedStatus === 'completed') await supabase.from('episodes').update({ status: 'in_consultation' }).eq('id', payment.episode_id).eq('status', 'created');

    return NextResponse.json({ success: true, message: 'Webhook received' }, { status: 200 });
  } catch (error: any) {
    console.error('CollectUG Webhook Handler Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
