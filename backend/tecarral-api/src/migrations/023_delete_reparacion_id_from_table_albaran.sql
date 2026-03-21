BEGIN;

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS fk_albaran_reparacion;

ALTER TABLE public.albaran
  DROP COLUMN IF EXISTS id_reparacion;

COMMIT;