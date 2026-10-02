import { supabaseServer as supabase } from './supabase';
import { hashPassword } from './auth';

export async function setPatientSecurityPin(patientId: string, pin: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'PIN must be exactly 4 digits' };
    }

    const pinHash = await hashPassword(pin);

    const { error } = await supabase
      .from('patients')
      .update({ security_pin_hash: pinHash })
      .eq('id', patientId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set PIN' };
  }
}

export async function verifyPatientPin(patientId: string, pin: string): Promise<{ success: boolean; patient?: any; error?: string }> {
  try {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'PIN must be exactly 4 digits' };
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, qr_code, first_name, last_name, security_pin_hash')
      .eq('id', patientId)
      .single();

    if (error || !patient) {
      return { success: false, error: 'Patient not found' };
    }

    if (!patient.security_pin_hash) {
      return { success: false, error: 'Security PIN not set for this patient' };
    }

    const { comparePassword } = await import('./auth');
    const isValid = await comparePassword(pin, patient.security_pin_hash);

    if (!isValid) {
      return { success: false, error: 'Invalid security PIN' };
    }

    const { security_pin_hash, ...safePatient } = patient;
    return { success: true, patient: safePatient };
  } catch (err: any) {
    return { success: false, error: err.message || 'PIN verification failed' };
  }
}
