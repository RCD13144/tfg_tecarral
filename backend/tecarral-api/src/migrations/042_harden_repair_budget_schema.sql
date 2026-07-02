ALTER TABLE public.presupuesto_reparacion
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS coverage_decision TEXT,
  ADD COLUMN IF NOT EXISTS coverage_reason TEXT,
  ADD COLUMN IF NOT EXISTS charge_reason TEXT,
  ADD COLUMN IF NOT EXISTS payer_type TEXT,
  ADD COLUMN IF NOT EXISTS albaran_origen_id INTEGER REFERENCES public.albaran(id_albaran) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS formal_snapshot_html TEXT;

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_charge_reason,
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_coverage_reason,
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_coverage_decision,
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_payer_type;

UPDATE public.presupuesto_reparacion
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE public.presupuesto_reparacion
SET updated_at = COALESCE(updated_at, created_at, NOW());

UPDATE public.presupuesto_reparacion
SET coverage_reason = CASE charge_reason
  WHEN 'PREVENTIVO_NO_CUBRE' THEN COALESCE(coverage_reason, 'PREVENTIVO_NO_CUBRE')
  WHEN 'TODO_INCLUIDO' THEN COALESCE(coverage_reason, 'TODO_INCLUIDO')
  WHEN 'REPARACION_PUNTUAL' THEN COALESCE(coverage_reason, 'REPARACION_PUNTUAL')
  WHEN 'OTRO' THEN COALESCE(coverage_reason, 'OTRO')
  ELSE coverage_reason
END,
charge_reason = CASE
  WHEN charge_reason = 'GOLPE_ACCIDENTE' THEN 'GOLPE_ACCIDENTE'
  ELSE NULL
END
WHERE charge_reason IS NOT NULL;

UPDATE public.presupuesto_reparacion
SET payer_type = CASE
  WHEN payer_type IN ('CLIENTE', 'TECARRAL') THEN payer_type
  WHEN payer_type = 'EMPRESA' THEN 'TECARRAL'
  ELSE 'CLIENTE'
END;

UPDATE public.presupuesto_reparacion
SET coverage_decision = CASE
  WHEN coverage_decision IN ('CLIENTE', 'TECARRAL') THEN coverage_decision
  WHEN coverage_decision = 'EMPRESA' THEN 'TECARRAL'
  WHEN payer_type = 'TECARRAL' THEN 'TECARRAL'
  ELSE 'CLIENTE'
END;

UPDATE public.presupuesto_reparacion
SET coverage_reason = CASE
  WHEN coverage_reason IN ('PREVENTIVO_NO_CUBRE', 'TODO_INCLUIDO', 'GOLPE_ACCIDENTE', 'REPARACION_PUNTUAL', 'OTRO') THEN coverage_reason
  WHEN charge_reason = 'GOLPE_ACCIDENTE' THEN 'GOLPE_ACCIDENTE'
  WHEN payer_type = 'TECARRAL' THEN 'TODO_INCLUIDO'
  ELSE 'REPARACION_PUNTUAL'
END;

ALTER TABLE public.presupuesto_reparacion
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN payer_type SET DEFAULT 'CLIENTE',
  ALTER COLUMN payer_type SET NOT NULL,
  ALTER COLUMN coverage_decision SET NOT NULL,
  ALTER COLUMN coverage_reason SET NOT NULL;

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_charge_reason,
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_coverage_reason,
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_coverage_decision,
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_payer_type;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT chk_presupuesto_reparacion_charge_reason
    CHECK (charge_reason IS NULL OR charge_reason = 'GOLPE_ACCIDENTE'),
  ADD CONSTRAINT chk_presupuesto_reparacion_coverage_reason
    CHECK (coverage_reason IN ('PREVENTIVO_NO_CUBRE', 'TODO_INCLUIDO', 'GOLPE_ACCIDENTE', 'REPARACION_PUNTUAL', 'OTRO')),
  ADD CONSTRAINT chk_presupuesto_reparacion_coverage_decision
    CHECK (coverage_decision IN ('CLIENTE', 'TECARRAL')),
  ADD CONSTRAINT chk_presupuesto_reparacion_payer_type
    CHECK (payer_type IN ('CLIENTE', 'TECARRAL'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_presupuesto_reparacion_set_updated_at ON public.presupuesto_reparacion;
CREATE TRIGGER trg_presupuesto_reparacion_set_updated_at
BEFORE UPDATE ON public.presupuesto_reparacion
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_presupuesto_reparacion_document_number
  ON public.presupuesto_reparacion(document_number);
