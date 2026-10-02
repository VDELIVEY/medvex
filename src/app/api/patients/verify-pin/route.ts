import { NextResponse } from 'next/server';
import { verifyPatientPin } from '@/lib/patient-pin';
import { requireSession } from '@/lib/session';
import {
  checkPatientPinAttempt,
  getPinAttemptSource,
  resetPatientPinAttempt,
} from '@/lib/patient-pin-rate-limit';

export async function POST(request: Request) {
  const auth = requireSession(request, ['ministry', 'superadmin', 'admin', 'doctor', 'receptionist', 'cashier', 'lab', 'pharmacy']);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { patientId, pin } = body;

    if (!patientId || !pin) {
      return NextResponse.json({ error: 'patientId and pin are required' }, { status: 400 });
    }

    const sourceKey = getPinAttemptSource(request);
    const { data: attemptState, error: limitError } = await checkPatientPinAttempt(patientId, sourceKey);
    if (limitError) {
      console.error('Patient PIN rate limit check failed:', limitError);
      return NextResponse.json({ error: 'Access verification is temporarily unavailable' }, { status: 503 });
    }
    if (!attemptState?.allowed) {
      return NextResponse.json({ error: 'Too many PIN attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const result = await verifyPatientPin(patientId, pin);

    if (!result.success) {
      return NextResponse.json({ error: 'Patient not found or PIN invalid' }, { status: 401 });
    }

    const { error: resetError } = await resetPatientPinAttempt(patientId, sourceKey);
    if (resetError) console.error('Failed to reset patient PIN attempts:', resetError);

    return NextResponse.json({ success: true, patient: result.patient });
  } catch (error) {
    console.error('PIN verification failed:', error);
    return NextResponse.json({ error: 'PIN verification failed' }, { status: 500 });
  }
}
