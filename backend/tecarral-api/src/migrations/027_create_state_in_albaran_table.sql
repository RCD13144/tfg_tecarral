BEGIN;

ALTER TABLE public.albaran
  ALTER COLUMN firma_cliente DROP NOT NULL;

ALTER TABLE public.albaran
  ALTER COLUMN firma_tecnico DROP NOT NULL;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS estado TEXT;

ALTER TABLE public.albaran
  ALTER COLUMN estado SET DEFAULT 'BORRADOR';

UPDATE public.albaran
SET estado = 'FIRMADO'
WHERE firma_cliente IS NOT NULL
  AND firma_tecnico IS NOT NULL
  AND estado IS NULL;

UPDATE public.albaran
SET estado = 'BORRADOR'
WHERE estado IS NULL;

ALTER TABLE public.albaran
  ALTER COLUMN estado SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_albaran_estado'
  ) THEN
    ALTER TABLE public.albaran
      ADD CONSTRAINT chk_albaran_estado
      CHECK (estado IN ('BORRADOR','FIRMADO'));
  END IF;
END$$;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS firmado_at TIMESTAMP;

COMMIT;