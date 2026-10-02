import { supabaseServer as supabase } from './supabase';

type NotificationChannel = 'sms' | 'email' | 'sms,email';

interface NotificationPayload {
  patientId: string;
  episodeId?: string | null;
  scannedBy?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  channel?: NotificationChannel;
  notificationType?: string;
}

interface NotificationResult {
  success: boolean;
  status: 'pending' | 'sent' | 'failed' | 'partial';
  details: {
    sms?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
  };
  error?: string;
}

function getEmailProvider() {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_API_KEY;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'noreply@medqr.health';
  const provider = process.env.NOTIFICATION_EMAIL_PROVIDER || 'resend';
  return { apiKey, fromEmail, provider };
}

function getSmsProvider() {
  const apiKey = process.env.TWILIO_API_KEY || process.env.AFRICAS_TALKING_API_KEY || process.env.SMS_API_KEY;
  const provider = process.env.NOTIFICATION_SMS_PROVIDER || 'twilio';
  return { apiKey, provider };
}

async function sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  const { apiKey, fromEmail, provider } = getEmailProvider();

  if (!apiKey) {
    return { success: false, error: 'Email provider not configured' };
  }

  try {
    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          html: body,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Resend API error' };
      }
      return { success: true };
    }

    if (provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail },
          subject,
          content: [{ type: 'text/html', value: body }],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `SendGrid error: ${res.status} ${text}` };
      }
      return { success: true };
    }

    return { success: false, error: `Unsupported email provider: ${provider}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Email send failed' };
  }
}

async function sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const { apiKey, provider } = getSmsProvider();

  if (!apiKey) {
    return { success: false, error: 'SMS provider not configured' };
  }

  try {
    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !fromNumber) {
        return { success: false, error: 'Twilio account SID or from number not configured' };
      }

      const auth = Buffer.from(`${accountSid}:${apiKey}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Twilio API error' };
      }
      return { success: true };
    }

    if (provider === 'africas_talking') {
      const username = process.env.AFRICAS_TALKING_USERNAME;
      const senderId = process.env.AFRICAS_TALKING_SENDER_ID || 'MedQR';

      if (!username) {
        return { success: false, error: 'Africa\'s Talking username not configured' };
      }

      const res = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': apiKey,
        },
        body: new URLSearchParams({
          username,
          to: to,
          message,
          from: senderId,
        }),
      });

      const data = await res.json();
      if (data.SMSMessageData && data.SMSMessageData.Recipients) {
        const recipients = data.SMSMessageData.Recipients;
        const allFailed = recipients.every((r: any) => r.status === 'Failure');
        if (allFailed) {
          return { success: false, error: 'All SMS deliveries failed' };
        }
        return { success: true };
      }
      return { success: false, error: 'Africa\'s Talking unexpected response' };
    }

    return { success: false, error: `Unsupported SMS provider: ${provider}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'SMS send failed' };
  }
}

export async function sendScanNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const {
    patientId,
    episodeId,
    scannedBy,
    recipientPhone,
    recipientEmail,
    channel = 'sms,email',
    notificationType = 'qr_scan_access',
  } = payload;

  const details: NotificationResult['details'] = {};
  let hasSuccess = false;
  let hasFailure = false;
  const errors: string[] = [];

  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, last_name, qr_code')
    .eq('id', patientId)
    .single();

  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'A patient';
  const qrCode = patient?.qr_code || 'N/A';
  const accessTime = new Date().toLocaleString();

  const smsMessage = `MedQR Alert: ${patientName}'s health pass (QR: ${qrCode}) was accessed at ${accessTime}. If this was not you, please contact support.`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #087f79;">MedQR Security Notification</h2>
      <p>Dear ${patientName},</p>
      <p>Your health pass was accessed at <strong>${accessTime}</strong>.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>QR Code:</strong> ${qrCode}</p>
      </div>
      <p>If you did not authorize this access, please contact your healthcare provider immediately.</p>
      <p style="color: #64748b; font-size: 12px;">Ministry of Health Digital Health Platform</p>
    </div>
  `;
  const emailSubject = `MedQR: Your Health Pass Was Accessed`;

  if (channel.includes('sms') && recipientPhone) {
    const smsResult = await sendSms(recipientPhone, smsMessage);
    details.sms = { success: smsResult.success, error: smsResult.error };
    if (smsResult.success) hasSuccess = true;
    else { hasFailure = true; errors.push(smsResult.error || 'SMS failed'); }
  }

  if (channel.includes('email') && recipientEmail) {
    const emailResult = await sendEmail(recipientEmail, emailSubject, emailHtml);
    details.email = { success: emailResult.success, error: emailResult.error };
    if (emailResult.success) hasSuccess = true;
    else { hasFailure = true; errors.push(emailResult.error || 'Email failed'); }
  }

  let finalStatus: NotificationResult['status'] = 'pending';
  if (!hasFailure && hasSuccess) finalStatus = 'sent';
  else if (hasFailure && hasSuccess) finalStatus = 'partial';
  else if (hasFailure && !hasSuccess) finalStatus = 'failed';

  const notificationRecord: any = {
    patient_id: patientId,
    episode_id: episodeId || null,
    scanned_by: scannedBy || null,
    notification_type: notificationType,
    channel,
    recipient_phone: recipientPhone || null,
    recipient_email: recipientEmail || null,
    status: finalStatus,
    error_message: errors.join('; ') || null,
  };

  if (details.sms?.error || details.email?.error) {
    notificationRecord.provider_response = {
      sms: details.sms,
      email: details.email,
      timestamp: new Date().toISOString(),
    };
  }

  const { error: dbError } = await supabase
    .from('scan_notifications')
    .insert([notificationRecord]);

  if (dbError) {
    console.error('Failed to log scan notification:', dbError);
  }

  return {
    success: hasSuccess,
    status: finalStatus,
    details,
    error: errors.join('; ') || undefined,
  };
}
