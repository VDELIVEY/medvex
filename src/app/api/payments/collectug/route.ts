import { NextRequest, NextResponse } from 'next/server';
import { CollectUGClient } from '@/lib/collectug';
import { requireSession } from '@/lib/session';
import { supabaseServer as supabase } from '@/lib/supabase';
import { generateCode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req, ['cashier', 'admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const collectUG = new CollectUGClient(process.env['COLLECTUG_API_KEY'], process.env['COLLECTUG_BASE_URL']);
    const body = await req.json();
    const { amount, phoneNumber, customerEmail, cardNumber, cardholderName, expiryDate, cvv, episodeId } = body;

    if (!episodeId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    if (!phoneNumber && !cardNumber) {
      return NextResponse.json({ error: 'Either phoneNumber (for Mobile Money) or Card details are required' }, { status: 400 });
    }
    if (phoneNumber && !/^\+?256\d{9}$|^0\d{9}$/.test(phoneNumber.replace(/[\s-]/g, ''))) {
      return NextResponse.json({ error: 'Enter a valid Uganda mobile-money number' }, { status: 400 });
    }
    const { data: episode, error: episodeError } = await supabase.from('episodes').select('id, institution_id, status').eq('id', episodeId).single();
    if (episodeError || !episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    if (auth.session.institutionId && episode.institution_id !== auth.session.institutionId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (episode.status !== 'created') return NextResponse.json({ error: 'This episode is not awaiting payment' }, { status: 409 });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const defaultCallbackUrl = `${protocol}://${host}/api/webhooks/collectug`;

    const merchantReference = `MEDQR-${generateCode('PAY', 12)}`;
    const result = await collectUG.createDeposit({
      amount: Number(amount),
      phoneNumber,
      merchantReference,
      customerEmail,
      callbackUrl: body.callbackUrl || defaultCallbackUrl,
      cardNumber,
      cardholderName,
      expiryDate,
      cvv,
    });

    const transactionId = result.transaction?.transaction_id;
    const { error: recordError } = await supabase.from('payments').insert({
      episode_id: episodeId,
      amount: Number(amount),
      method: phoneNumber ? 'mobile' : 'card',
      type: 'consultation',
      cashier_id: auth.session.staffId,
      receipt_number: generateCode('RCT', 10),
      status: result.transaction?.status === 'completed' ? 'completed' : 'pending',
      transaction_id: transactionId || null,
      merchant_reference: merchantReference,
      phone_number: phoneNumber || null,
      provider_response: { transaction: result.transaction || null, message: result.message },
    });
    if (recordError) return NextResponse.json({ error: 'Payment started but could not be recorded' }, { status: 500 });
    if (result.transaction?.status === 'completed') {
      await supabase.from('episodes').update({ status: 'in_consultation' }).eq('id', episodeId).eq('status', 'created');
    }

    return NextResponse.json({ success: true, data: result, merchantReference, episodeId });
  } catch (error: any) {
    console.error('CollectUG payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process payment with CollectUG' },
      { status: 500 }
    );
  }
}
