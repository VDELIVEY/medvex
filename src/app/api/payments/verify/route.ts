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

    if (!transactionId) {
      return NextResponse.json({ error: 'transaction_id parameter is required' }, { status: 400 });
    }

    // Query CollectUG transactions for this transaction_id
    const response = await collectUG.getTransactions({ page: 1 });
    const transactions = response?.data || [];
    
    const found = transactions.find((t: any) => t.transaction_id === transactionId);

    if (found) {
      const nextStatus = found.status === 'completed' ? 'completed' : found.status === 'failed' ? 'failed' : 'pending';
      const { data: payment } = await supabase.from('payments').select('id, episode_id, status').eq('transaction_id', transactionId).maybeSingle();
      if (payment && payment.status !== nextStatus) {
        await supabase.from('payments').update({ status: nextStatus, provider_response: found }).eq('id', payment.id);
        if (nextStatus === 'completed') await supabase.from('episodes').update({ status: 'in_consultation' }).eq('id', payment.episode_id).eq('status', 'created');
      }
      return NextResponse.json({
        success: true,
        status: found.status, // e.g. 'completed', 'pending', 'failed'
        transaction: found,
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
