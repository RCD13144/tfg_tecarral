
ALTER TABLE public.reparacion
  ADD COLUMN IF NOT EXISTS service_case_type TEXT,
  ADD COLUMN IF NOT EXISTS service_visit_kind TEXT;

ALTER TABLE public.reparacion
  DROP CONSTRAINT IF EXISTS chk_reparacion_service_case_type;

ALTER TABLE public.reparacion
  ADD CONSTRAINT chk_reparacion_service_case_type
  CHECK (
    service_case_type IS NULL
    OR service_case_type IN ('CLIENTE_HABITUAL', 'CLIENTE_NUEVO')
  );

ALTER TABLE public.reparacion
  DROP CONSTRAINT IF EXISTS chk_reparacion_service_visit_kind;

ALTER TABLE public.reparacion
  ADD CONSTRAINT chk_reparacion_service_visit_kind
  CHECK (
    service_visit_kind IS NULL
    OR service_visit_kind IN (
      'PRIMERA_VISITA',
      'REVISION',
      'REPARACION',
      'PRESUPUESTO_PREVIO',
      'PEDIDO_RECAMBIO'
    )
  );

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS document_kind TEXT,
  ADD COLUMN IF NOT EXISTS service_case_type TEXT,
  ADD COLUMN IF NOT EXISTS service_visit_kind TEXT,
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT,
  ADD COLUMN IF NOT EXISTS pricing_base_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS includes_travel BOOLEAN,
  ADD COLUMN IF NOT EXISTS estimated_work_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS hours_start TEXT,
  ADD COLUMN IF NOT EXISTS hours_end TEXT,
  ADD COLUMN IF NOT EXISTS total_hours NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS desplazamiento_text TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS document_snapshot_html TEXT,
  ADD COLUMN IF NOT EXISTS queued_for_karve_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_to_accounting_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accounting_email_status TEXT;

UPDATE public.albaran
SET
  document_kind = COALESCE(document_kind, 'ALBARAN'),
  includes_travel = COALESCE(includes_travel, TRUE),
  pricing_mode = COALESCE(pricing_mode, 'FACTURAR_POSTERIOR'),
  accounting_email_status = COALESCE(accounting_email_status, 'PENDING');

ALTER TABLE public.albaran
  ALTER COLUMN document_kind SET DEFAULT 'ALBARAN';

ALTER TABLE public.albaran
  ALTER COLUMN pricing_mode SET DEFAULT 'FACTURAR_POSTERIOR';

ALTER TABLE public.albaran
  ALTER COLUMN includes_travel SET DEFAULT TRUE;

ALTER TABLE public.albaran
  ALTER COLUMN accounting_email_status SET DEFAULT 'PENDING';

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS chk_albaran_document_kind;

ALTER TABLE public.albaran
  ADD CONSTRAINT chk_albaran_document_kind
  CHECK (document_kind IN ('ALBARAN', 'PRESUPUESTO', 'PEDIDO', 'SERVICIO_TECNICO'));

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS chk_albaran_service_case_type;

ALTER TABLE public.albaran
  ADD CONSTRAINT chk_albaran_service_case_type
  CHECK (
    service_case_type IS NULL
    OR service_case_type IN ('CLIENTE_HABITUAL', 'CLIENTE_NUEVO')
  );

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS chk_albaran_service_visit_kind;

ALTER TABLE public.albaran
  ADD CONSTRAINT chk_albaran_service_visit_kind
  CHECK (
    service_visit_kind IS NULL
    OR service_visit_kind IN (
      'PRIMERA_VISITA',
      'REVISION',
      'REPARACION',
      'PRESUPUESTO_PREVIO',
      'PEDIDO_RECAMBIO'
    )
  );

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS chk_albaran_pricing_mode;

ALTER TABLE public.albaran
  ADD CONSTRAINT chk_albaran_pricing_mode
  CHECK (
    pricing_mode IN ('FACTURAR_POSTERIOR', 'PREVISION_GASTO_FIJA', 'COSTE_CERO')
  );

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS chk_albaran_accounting_email_status;

ALTER TABLE public.albaran
  ADD CONSTRAINT chk_albaran_accounting_email_status
  CHECK (
    accounting_email_status IN ('PENDING', 'SENT', 'ERROR')
  );

CREATE TABLE IF NOT EXISTS public.accounting_document_queue (
  id BIGSERIAL PRIMARY KEY,
  document_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  html_snapshot TEXT,
  payload_json JSONB,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  last_error TEXT
);

ALTER TABLE public.accounting_document_queue
  DROP CONSTRAINT IF EXISTS chk_accounting_document_queue_document_type;

ALTER TABLE public.accounting_document_queue
  ADD CONSTRAINT chk_accounting_document_queue_document_type
  CHECK (document_type IN ('ALBARAN', 'PRESUPUESTO_REPARACION', 'CONTRATO_MANTENIMIENTO', 'PEDIDO'));

ALTER TABLE public.accounting_document_queue
  DROP CONSTRAINT IF EXISTS chk_accounting_document_queue_status;

ALTER TABLE public.accounting_document_queue
  ADD CONSTRAINT chk_accounting_document_queue_status
  CHECK (status IN ('PENDING', 'SENT', 'ERROR'));

CREATE INDEX IF NOT EXISTS idx_accounting_document_queue_status
  ON public.accounting_document_queue (status, queued_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_accounting_document_queue_entity
  ON public.accounting_document_queue (entity_type, entity_id, document_type);
