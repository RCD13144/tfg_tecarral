
ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS document_number TEXT;

ALTER TABLE public.presupuesto_reparacion
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS albaran_origen_id BIGINT,
  ADD COLUMN IF NOT EXISTS formal_snapshot_html TEXT;

ALTER TABLE public.service_contract
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS formal_snapshot_html TEXT;

CREATE TABLE IF NOT EXISTS public.document_series_counter (
  document_type TEXT NOT NULL,
  year_2_digits TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_document_series_counter PRIMARY KEY (document_type, year_2_digits),
  CONSTRAINT chk_document_series_counter_type
    CHECK (document_type IN ('ALBARAN', 'PRESUPUESTO_REPARACION', 'CONTRATO_MANTENIMIENTO')),
  CONSTRAINT chk_document_series_counter_year
    CHECK (length(trim(year_2_digits)) = 2),
  CONSTRAINT chk_document_series_counter_value
    CHECK (current_value >= 0)
);

CREATE TABLE IF NOT EXISTS public.formal_document (
  id BIGSERIAL PRIMARY KEY,
  document_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  document_number TEXT NOT NULL,
  snapshot_html TEXT,
  signature_status TEXT NOT NULL DEFAULT 'PENDING',
  public_url TEXT,
  accounting_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_formal_document_type
    CHECK (document_type IN ('ALBARAN', 'PRESUPUESTO_REPARACION', 'CONTRATO_MANTENIMIENTO')),
  CONSTRAINT chk_formal_document_signature_status
    CHECK (signature_status IN ('PENDING', 'PARTIAL', 'SIGNED')),
  CONSTRAINT chk_formal_document_accounting_status
    CHECK (accounting_status IN ('PENDING', 'SENT', 'ERROR')),
  CONSTRAINT ux_formal_document_entity UNIQUE (entity_type, entity_id, document_type),
  CONSTRAINT ux_formal_document_number UNIQUE (document_number)
);

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS fk_presupuesto_reparacion_albaran_origen;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT fk_presupuesto_reparacion_albaran_origen
  FOREIGN KEY (albaran_origen_id)
  REFERENCES public.albaran (id_albaran)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_albaran_document_number
  ON public.albaran (document_number)
  WHERE document_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_presupuesto_reparacion_document_number
  ON public.presupuesto_reparacion (document_number)
  WHERE document_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_service_contract_document_number
  ON public.service_contract (document_number)
  WHERE document_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_formal_document_type_status
  ON public.formal_document (document_type, signature_status, created_at DESC);
