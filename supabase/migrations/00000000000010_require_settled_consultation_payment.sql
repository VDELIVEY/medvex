-- Fail closed: consultation episodes can only be activated after settlement.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Apply the CollectUG payment-tracking migration before this migration';
  END IF;
END;
$$;

ALTER TABLE public.payments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.require_settled_consultation_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'in_consultation' AND OLD.status IS DISTINCT FROM NEW.status
     AND NOT EXISTS (
       SELECT 1
       FROM public.payments p
       WHERE p.episode_id = NEW.id
         AND p.type = 'consultation'
         AND p.status = 'completed'
         AND p.verified_at IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'A completed consultation payment is required before consultation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS episodes_require_settled_consultation_payment ON public.episodes;
CREATE TRIGGER episodes_require_settled_consultation_payment
  BEFORE UPDATE OF status ON public.episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.require_settled_consultation_payment();

CREATE INDEX IF NOT EXISTS idx_payments_episode_status_type
  ON public.payments (episode_id, status, type);
CREATE INDEX IF NOT EXISTS idx_payments_verified_consultation
  ON public.payments (episode_id, type, verified_at)
  WHERE status = 'completed' AND verified_at IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'episodes_require_settled_consultation_payment'
      AND tgrelid = 'public.episodes'::regclass
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Consultation payment guard trigger was not installed';
  END IF;
END;
$$;