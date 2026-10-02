import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/session';
import { verifyPatientPin } from '@/lib/patient-pin';
import {
  checkPatientPinAttempt,
  getPinAttemptSource,
  resetPatientPinAttempt,
} from '@/lib/patient-pin-rate-limit';
import { sendScanNotification } from '@/lib/notifications';

const STAFF_ROLES = ['ministry', 'superadmin', 'admin', 'doctor', 'receptionist', 'cashier', 'lab', 'pharmacy'] as const;

export async function POST(request: Request) {
  const auth = requireSession(request, [...STAFF_ROLES]);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const qr = typeof body.qr === 'string' ? body.qr.trim() : '';
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!qr || qr.length > 128 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'A patient QR and four-digit PIN are required' }, { status: 400 });
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, qr_code, first_name, last_name, age, gender, blood_type, underlying_conditions, medical_history, allergies, phone, email, dob')
      .eq('qr_code', qr)
      .maybeSingle();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found or PIN invalid' }, { status: 404 });
    }

    const sourceKey = getPinAttemptSource(request);
    const { data: attemptState, error: limitError } = await checkPatientPinAttempt(patient.id, sourceKey);
    if (limitError) {
      console.error('Patient PIN rate limit check failed:', limitError);
      return NextResponse.json({ error: 'Access verification is temporarily unavailable' }, { status: 503 });
    }
    if (!attemptState?.allowed) {
      return NextResponse.json({ error: 'Too many PIN attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const verification = await verifyPatientPin(patient.id, pin);
    if (!verification.success) {
      return NextResponse.json({ error: 'Patient not found or PIN invalid' }, { status: 401 });
    }

    const { error: resetError } = await resetPatientPinAttempt(patient.id, sourceKey);
    if (resetError) console.error('Failed to reset patient PIN attempts:', resetError);

    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('id, episode_code, status, created_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (episodesError) {
      return NextResponse.json({ error: 'Unable to load patient history' }, { status: 500 });
    }

    const episodeIds = (episodes || []).map((episode) => episode.id);
    const [diagnosesResult, prescriptionsResult] = episodeIds.length
      ? await Promise.all([
          supabase.from('diagnoses').select('id, episode_id, doctor_id, notes, created_at').in('episode_id', episodeIds),
          supabase.from('prescriptions').select('id, episode_id, medication, dosage, instructions, requested_quantity, dispensed_quantity, dispensed, created_at').in('episode_id', episodeIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

    if (diagnosesResult.error || prescriptionsResult.error) {
      return NextResponse.json({ error: 'Unable to load patient history' }, { status: 500 });
    }

    const history = (episodes || []).map((episode) => ({
      ...episode,
      diagnoses: (diagnosesResult.data || []).filter((diagnosis) => diagnosis.episode_id === episode.id),
      prescriptions: (prescriptionsResult.data || []).filter((prescription) => prescription.episode_id === episode.id),
    }));

    let notificationStatus = 'unavailable';
    try {
      const notification = await sendScanNotification({
        patientId: patient.id,
        scannedBy: auth.session.staffId,
        recipientPhone: patient.phone,
        recipientEmail: patient.email,
      });
      notificationStatus = notification.status;
    } catch (notificationError) {
      console.error('Patient access notification failed:', notificationError);
    }

    return NextResponse.json({ success: true, patient, episodes: history, notificationStatus });
  } catch (error) {
    console.error('Patient portal access failed:', error);
    return NextResponse.json({ error: 'Unable to verify patient access' }, { status: 500 });
  }
}