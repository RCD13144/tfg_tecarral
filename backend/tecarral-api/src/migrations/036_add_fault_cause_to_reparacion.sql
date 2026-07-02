BEGIN;

ALTER TABLE public.reparacion
  ADD COLUMN IF NOT EXISTS fault_cause TEXT;

ALTER TABLE public.reparacion
  DROP CONSTRAINT IF EXISTS chk_reparacion_fault_cause;

ALTER TABLE public.reparacion
  ADD CONSTRAINT chk_reparacion_fault_cause
  CHECK (
    fault_cause IS NULL
    OR fault_cause IN ('DESGASTE_USO', 'GOLPE_ACCIDENTE')
  );

COMMIT;
