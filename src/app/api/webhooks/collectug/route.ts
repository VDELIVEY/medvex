import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await req.json();
    return NextResponse.json({ success: true, status: 'pending', message: 'Callback received; payment must be verified with CollectUG.' }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
