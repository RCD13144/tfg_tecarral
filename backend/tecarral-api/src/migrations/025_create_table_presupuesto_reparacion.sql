BEGIN;

CREATE TABLE IF NOT EXISTS public.presupuesto_reparacion (
    id BIGSERIAL PRIMARY KEY,
    reparacion_id BIGINT NOT NULL,
    propuesta_alquiler_id BIGINT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDING',
    public_token TEXT NOT NULL,
    importe_total NUMERIC(12,2),
    condiciones TEXT,
    expira_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_estado;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT chk_presupuesto_reparacion_estado
  CHECK (
    estado IN (
      'PENDING',
      'ACEPTADA',
      'RECHAZADA',
      'EXPIRADA',
      'FINALIZADA'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_presupuesto_reparacion_reparacion'
  ) THEN
    ALTER TABLE public.presupuesto_reparacion
      ADD CONSTRAINT fk_presupuesto_reparacion_reparacion
      FOREIGN KEY (reparacion_id)
      REFERENCES public.reparacion (id_reparacion)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_presupuesto_reparacion_propuesta'
  ) THEN
    ALTER TABLE public.presupuesto_reparacion
      ADD CONSTRAINT fk_presupuesto_reparacion_propuesta
      FOREIGN KEY (propuesta_alquiler_id)
      REFERENCES public.propuesta_alquiler (id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ux_presupuesto_reparacion_reparacion'
  ) THEN
    ALTER TABLE public.presupuesto_reparacion
      ADD CONSTRAINT ux_presupuesto_reparacion_reparacion
      UNIQUE (reparacion_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ux_presupuesto_reparacion_token'
  ) THEN
    ALTER TABLE public.presupuesto_reparacion
      ADD CONSTRAINT ux_presupuesto_reparacion_token
      UNIQUE (public_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_presupuesto_reparacion_estado
  ON public.presupuesto_reparacion (estado);

CREATE INDEX IF NOT EXISTS idx_presupuesto_reparacion_propuesta
  ON public.presupuesto_reparacion (propuesta_alquiler_id);

COMMIT;