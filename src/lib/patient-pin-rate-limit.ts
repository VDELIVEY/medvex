import { createHmac } from 'crypto';
import { supabaseServer } from './supabase';

function getRateLimitSecret() {
  const secret = process.env.MEDQR_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('MEDQR_SESSION_SECRET must be at least 32 characters');
  }
  return secret;
}

export function getPinAttemptSource(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const source = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || forwardedFor?.split(',')[0]?.trim()
    || 'unknown';
  return createHmac('sha256', getRateLimitSecret()).update(source).digest('hex');
}

export async function checkPatientPinAttempt(patientId: string, sourceKey: string) {
  return supabaseServer.rpc('check_patient_pin_attempt', {
    p_patient_id: patientId,
    p_source_key: sourceKey,
  });
}

export async function resetPatientPinAttempt(patientId: string, sourceKey: string) {
  return supabaseServer.rpc('reset_patient_pin_attempt', {
    p_patient_id: patientId,
    p_source_key: sourceKey,
  });
}