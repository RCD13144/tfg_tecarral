ALTER TABLE public.presupuesto_reparacion
  ADD COLUMN IF NOT EXISTS iva_rate NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  ADD COLUMN IF NOT EXISTS base_imponible NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS iva_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS firma_tecnico BYTEA,
  ADD COLUMN IF NOT EXISTS firma_tecnico_mime TEXT,
  ADD COLUMN IF NOT EXISTS firmado_tecnico_nombre TEXT,
  ADD COLUMN IF NOT EXISTS firmado_tecnico_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS firmado_tecnico_user_id BIGINT,
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;

UPDATE public.presupuesto_reparacion
SET
  base_imponible = COALESCE(base_imponible, ROUND((COALESCE(importe_total, 0) / 1.21)::numeric, 2)),
  iva_amount = COALESCE(iva_amount, ROUND((COALESCE(importe_total, 0) - (COALESCE(importe_total, 0) / 1.21))::numeric, 2))
WHERE base_imponible IS NULL
   OR iva_amount IS NULL;

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS fk_presupuesto_reparacion_tecnico_user;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT fk_presupuesto_reparacion_tecnico_user
  FOREIGN KEY (firmado_tecnico_user_id)
  REFERENCES public.users (id_user)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.presupuesto_reparacion_line (
  id BIGSERIAL PRIMARY KEY,
  presupuesto_reparacion_id BIGINT NOT NULL,
  line_order INTEGER NOT NULL DEFAULT 1,
  referencia TEXT,
  descripcion TEXT NOT NULL,
  unidades NUMERIC(10,2) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_presupuesto_reparacion_line_presupuesto
    FOREIGN KEY (presupuesto_reparacion_id)
    REFERENCES public.presupuesto_reparacion (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_presupuesto_reparacion_line_order
    CHECK (line_order > 0),
  CONSTRAINT chk_presupuesto_reparacion_line_unidades
    CHECK (unidades > 0),
  CONSTRAINT chk_presupuesto_reparacion_line_precio
    CHECK (precio_unitario >= 0),
  CONSTRAINT chk_presupuesto_reparacion_line_total
    CHECK (line_total >= 0),
  CONSTRAINT ux_presupuesto_reparacion_line_order
    UNIQUE (presupuesto_reparacion_id, line_order)
);

INSERT INTO public.presupuesto_reparacion_line (
  presupuesto_reparacion_id,
  line_order,
  referencia,
  descripcion,
  unidades,
  precio_unitario,
  line_total
)
SELECT
  pr.id,
  1,
  NULL,
  COALESCE(NULLIF(TRIM(pr.condiciones), ''), 'Reparación según presupuesto'),
  1,
  COALESCE(pr.base_imponible, pr.importe_total, 0),
  COALESCE(pr.base_imponible, pr.importe_total, 0)
FROM public.presupuesto_reparacion pr
WHERE NOT EXISTS (
  SELECT 1
  FROM public.presupuesto_reparacion_line l
  WHERE l.presupuesto_reparacion_id = pr.id
);

ALTER TABLE public.formal_document_delivery
  ADD COLUMN IF NOT EXISTS delivery_stage TEXT NOT NULL DEFAULT 'FINAL';

ALTER TABLE public.formal_document_delivery
  DROP CONSTRAINT IF EXISTS chk_formal_document_delivery_stage;

ALTER TABLE public.formal_document_delivery
  ADD CONSTRAINT chk_formal_document_delivery_stage
  CHECK (delivery_stage IN ('ISSUED', 'FINAL'));

ALTER TABLE public.formal_document_delivery
  DROP CONSTRAINT IF EXISTS ux_formal_document_delivery_recipient;

CREATE UNIQUE INDEX IF NOT EXISTS ux_formal_document_delivery_recipient_stage
  ON public.formal_document_delivery (formal_document_id, recipient_type, delivery_stage);

CREATE TABLE IF NOT EXISTS public.formal_document_artifact (
  id BIGSERIAL PRIMARY KEY,
  formal_document_id BIGINT NOT NULL,
  artifact_stage TEXT NOT NULL,
  pdf_content BYTEA NOT NULL,
  pdf_mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  pdf_filename TEXT NOT NULL,
  pdf_sha256 TEXT NOT NULL,
  pdf_generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_formal_document_artifact_document
    FOREIGN KEY (formal_document_id)
    REFERENCES public.formal_document (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_formal_document_artifact_stage
    CHECK (artifact_stage IN ('ISSUED', 'FINAL')),
  CONSTRAINT chk_formal_document_artifact_version
    CHECK (pdf_version > 0),
  CONSTRAINT ux_formal_document_artifact_stage_version
    UNIQUE (formal_document_id, artifact_stage, pdf_version)
);
