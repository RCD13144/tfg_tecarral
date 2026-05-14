BEGIN;

ALTER TABLE public.presupuesto_reparacion
  ADD COLUMN IF NOT EXISTS payer_type TEXT;

ALTER TABLE public.presupuesto_reparacion
  ADD COLUMN IF NOT EXISTS charge_reason TEXT;

UPDATE public.presupuesto_reparacion
SET payer_type = COALESCE(payer_type, 'CLIENTE')
WHERE payer_type IS NULL;

ALTER TABLE public.presupuesto_reparacion
  ALTER COLUMN payer_type SET NOT NULL;

ALTER TABLE public.presupuesto_reparacion
  ALTER COLUMN public_token DROP NOT NULL;

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_payer_type;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT chk_presupuesto_reparacion_payer_type
  CHECK (payer_type IN ('CLIENTE', 'EMPRESA'));

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_charge_reason;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT chk_presupuesto_reparacion_charge_reason
  CHECK (
    charge_reason IS NULL
    OR charge_reason IN ('GOLPE_ACCIDENTE')
  );

CREATE INDEX IF NOT EXISTS idx_presupuesto_reparacion_payer_type
  ON public.presupuesto_reparacion (payer_type);

COMMIT;
