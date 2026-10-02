import { NextRequest, NextResponse } from 'next/server';
import { CollectUGClient } from '@/lib/collectug';
import { requireSession } from '@/lib/session';
import { supabaseServer as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req, ['cashier', 'admin', 'ministry', 'superadmin']);
    if (auth.response) return auth.response;
    const collectUG = new CollectUGClient(process.env['COLLECTUG_API_KEY'], process.env['COLLECTUG_BASE_URL']);
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transaction_id');
    const merchantReference = searchParams.get('merchant_reference');

    if (!transactionId && !merchantReference) {
      return NextResponse.json({ error: 'transaction_id or merchant_reference is required' }, { status: 400 });
    }

    let paymentQuery = supabase
      .from('payments')
      .select('id, episode_id, amount, merchant_reference, status, verified_at, episodes(institution_id)');
    paymentQuery = transactionId
      ? paymentQuery.eq('transaction_id', transactionId)
      : paymentQuery.eq('merchant_reference', merchantReference!);
    const { data: payment, error: paymentError } = await paymentQuery.maybeSingle();
    if (paymentError) return NextResponse.json({ error: 'Unable to load payment record' }, { status: 500 });
    if (!payment) return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    const episode = Array.isArray(payment.episodes) ? payment.episodes[0] : payment.episodes;
    if (auth.session.institutionId && episode?.institution_id !== auth.session.institutionId) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    }
    if (payment.status === 'completed' && payment.verified_at) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        receiptNumber: (await supabase.from('payments').select('receipt_number').eq('id', payment.id).maybeSingle()).data?.receipt_number,
      });
    }

    const response = await collectUG.getTransactions({ page: 1 });
    const transactions = Array.isArray(response?.data) ? response.data : [];
    const found = transactions.find((transaction: any) => transactionId
      ? transaction.transaction_id === transactionId
      : transaction.merchant_reference === merchantReference);

    if (found) {
      if (!found.transaction_id
        || Number(found.amount) !== Number(payment.amount)
        || found.merchant_reference !== payment.merchant_reference
        || (transactionId && found.transaction_id !== transactionId)) {
        return NextResponse.json({ error: 'Provider transaction does not match the recorded payment' }, { status: 409 });
      }

      const providerStatus = String(found.status || '').toLowerCase();
      const nextStatus = providerStatus === 'completed'
        ? 'completed'
        : ['failed', 'cancelled'].includes(providerStatus) ? providerStatus : 'pending';

      if (nextStatus === 'completed' && (payment.status === 'pending' || !payment.verified_at)) {
        const { data: updatedPayment, error: updateError } = await supabase
          .from('payments')
          .update({ status: 'completed', verified_at: new Date().toISOString(), transaction_id: found.transaction_id, provider_response: found })
          .eq('id', payment.id)
          .eq('status', payment.status)
          .select('id')
          .maybeSingle();
        if (updateError) return NextResponse.json({ error: 'Unable to record provider payment status' }, { status: 500 });

        if (updatedPayment && nextStatus === 'completed') {
          const { error: episodeError } = await supabase
            .from('episodes')
            .update({ status: 'in_consultation' })
            .eq('id', payment.episode_id)
            .eq('status', 'created');
          if (episodeError) {
            console.error('Verified payment recorded but episode transition failed:', episodeError);
            return NextResponse.json({ error: 'Payment verified; episode requires administrator attention' }, { status: 500 });
          }
        }
      } else if (payment.status === 'pending' && nextStatus !== 'pending') {
        const { error: updateError } = await supabase
          .from('payments')
          .update({ status: nextStatus, transaction_id: found.transaction_id, provider_response: found })
          .eq('id', payment.id)
          .eq('status', 'pending');
        if (updateError) return NextResponse.json({ error: 'Unable to record provider payment status' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        status: payment.status === 'completed' && payment.verified_at ? 'completed' : nextStatus,
        transaction: found,
        receiptNumber: (await supabase.from('payments').select('receipt_number').eq('id', payment.id).maybeSingle()).data?.receipt_number,
      });
    }

    // If not found in immediate page query, default to pending while waiting for callback
    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Transaction processing',
    });
  } catch (error: any) {
    console.error('Error verifying CollectUG transaction status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify transaction status' },
      { status: 500 }
    );
  }
}
