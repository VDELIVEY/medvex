-- Run in the Supabase SQL Editor or apply with the migration workflow.
-- All prescriptions for an episode are dispensed in one database transaction.

DO $$
BEGIN
  IF to_regprocedure('public.dispense_prescription(uuid,integer,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Required function public.dispense_prescription(uuid, integer, uuid) is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'prescriptions'
      AND column_name = 'dispensed_quantity'
  ) THEN
    RAISE EXCEPTION 'Required column public.prescriptions.dispensed_quantity is missing';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispense_episode_prescriptions(
  p_episode_id UUID,
  p_staff_id UUID,
  p_institution_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_episode RECORD;
  v_prescription RECORD;
  v_remaining INTEGER;
  v_dispensed JSONB := '[]'::JSONB;
  v_count INTEGER := 0;
BEGIN
  SELECT id, institution_id, status
  INTO v_episode
  FROM public.episodes
  WHERE id = p_episode_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Episode not found';
  END IF;

  IF p_institution_id IS NOT NULL AND v_episode.institution_id <> p_institution_id THEN
    RAISE EXCEPTION 'Episode not found';
  END IF;

  IF v_episode.status::TEXT NOT IN (
    'created',
    'in_consultation',
    'waiting_lab',
    'lab_results_ready',
    'waiting_cashier',
    'consultation_complete',
    'waiting_pharmacy_payment',
    'prescription_ready',
    'completed'
  ) THEN
    RAISE EXCEPTION 'Dispensing is not allowed for episode status %', v_episode.status;
  END IF;

  FOR v_prescription IN
    SELECT id, requested_quantity, dispensed_quantity
    FROM public.prescriptions
    WHERE episode_id = p_episode_id
    ORDER BY id
    FOR UPDATE
  LOOP
    v_count := v_count + 1;
    IF v_prescription.requested_quantity IS NULL OR v_prescription.requested_quantity <= 0 THEN
      RAISE EXCEPTION 'Prescription % has an invalid requested quantity', v_prescription.id;
    END IF;

    IF COALESCE(v_prescription.dispensed_quantity, 0) > v_prescription.requested_quantity THEN
      RAISE EXCEPTION 'Prescription % has already exceeded its requested quantity', v_prescription.id;
    END IF;
    v_remaining := v_prescription.requested_quantity - COALESCE(v_prescription.dispensed_quantity, 0);

    IF v_remaining > 0 THEN
      v_dispensed := v_dispensed || jsonb_build_array(
        public.dispense_prescription(v_prescription.id, v_remaining, p_staff_id)
      );
    END IF;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No prescriptions found to dispense';
  END IF;

  UPDATE public.episodes
  SET status = 'completed'
  WHERE id = p_episode_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'episode_id', p_episode_id,
    'dispensed', v_dispensed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dispense_episode_prescriptions(UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dispense_episode_prescriptions(UUID, UUID, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispense_episode_prescriptions(UUID, UUID, UUID) TO service_role;

DO $$
BEGIN
  IF to_regprocedure('public.dispense_episode_prescriptions(uuid,uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Atomic episode dispensing function was not installed';
  END IF;

  IF NOT has_function_privilege('service_role', 'public.dispense_episode_prescriptions(uuid,uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute atomic episode dispensing';
  END IF;

  IF has_function_privilege('anon', 'public.dispense_episode_prescriptions(uuid,uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.dispense_episode_prescriptions(uuid,uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Atomic episode dispensing must not be executable by client roles';
  END IF;
END;
$$;