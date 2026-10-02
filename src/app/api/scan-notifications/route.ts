import { NextResponse } from 'next/server';
import { sendScanNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientId,
      episodeId,
      scannedBy,
      recipientPhone,
      recipientEmail,
      channel,
      notificationType,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const result = await sendScanNotification({
      patientId,
      episodeId,
      scannedBy,
      recipientPhone: recipientPhone || null,
      recipientEmail: recipientEmail || null,
      channel: channel || 'sms,email',
      notificationType: notificationType || 'qr_scan_access',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Notification failed', status: result.status, details: result.details },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      details: result.details,
      message: result.status === 'sent' ? 'Notification sent successfully' : 'Notification sent with partial success',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Notification failed: ' + err.message }, { status: 500 });
  }
}
