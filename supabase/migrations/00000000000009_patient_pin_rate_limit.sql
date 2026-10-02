-- Apply after the existing patient security migration.
-- Tracks PIN attempts without retaining client IP addresses in plaintext.

CREATE TABLE IF NOT EXISTS public.patient_pin_attempts (
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (patient_id, source_key)
);

ALTER TABLE public.patient_pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_patient_pin_attempt(
  p_patient_id UUID,
  p_source_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.patient_pin_attempts%ROWTYPE;
BEGIN
  IF p_source_key IS NULL OR length(p_source_key) < 32 OR length(p_source_key) > 128 THEN
    RAISE EXCEPTION 'Invalid attempt source key';
  END IF;

  INSERT INTO public.patient_pin_attempts (patient_id, source_key)
  VALUES (p_patient_id, p_source_key)
  ON CONFLICT (patient_id, source_key) DO NOTHING;

  SELECT * INTO v_attempt
  FROM public.patient_pin_attempts
  WHERE patient_id = p_patient_id AND source_key = p_source_key
  FOR UPDATE;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > NOW() THEN
    RETURN jsonb_build_object('allowed', FALSE, 'retry_after', v_attempt.locked_until);
  END IF;

  IF v_attempt.window_started_at <= NOW() - INTERVAL '15 minutes'
     OR (v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until <= NOW()) THEN
    UPDATE public.patient_pin_attempts
    SET attempt_count = 1,
        window_started_at = NOW(),
        locked_until = NULL,
        updated_at = NOW()
    WHERE patient_id = p_patient_id AND source_key = p_source_key;
    RETURN jsonb_build_object('allowed', TRUE, 'remaining', 4);
  END IF;

  IF v_attempt.attempt_count >= 5 THEN
    UPDATE public.patient_pin_attempts
    SET locked_until = NOW() + INTERVAL '15 minutes', updated_at = NOW()
    WHERE patient_id = p_patient_id AND source_key = p_source_key;
    RETURN jsonb_build_object('allowed', FALSE, 'retry_after', NOW() + INTERVAL '15 minutes');
  END IF;

  UPDATE public.patient_pin_attempts
  SET attempt_count = attempt_count + 1, updated_at = NOW()
  WHERE patient_id = p_patient_id AND source_key = p_source_key;

  RETURN jsonb_build_object('allowed', TRUE, 'remaining', 4 - v_attempt.attempt_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_patient_pin_attempt(
  p_patient_id UUID,
  p_source_key TEXT
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.patient_pin_attempts
  WHERE patient_id = p_patient_id AND source_key = p_source_key;
$$;

REVOKE ALL ON public.patient_pin_attempts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_patient_pin_attempt(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_patient_pin_attempt(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_patient_pin_attempt(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_patient_pin_attempt(UUID, TEXT) TO service_role;

DO $$
BEGIN
  IF NOT has_function_privilege('service_role', 'public.check_patient_pin_attempt(uuid,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.reset_patient_pin_attempt(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role is missing patient PIN rate-limit function permissions';
  END IF;
  IF has_function_privilege('anon', 'public.check_patient_pin_attempt(uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.check_patient_pin_attempt(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Client roles must not execute patient PIN rate-limit functions';
  END IF;
END;
$$;