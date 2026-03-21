BEGIN;

ALTER TABLE public.reparacion
  DROP COLUMN IF EXISTS diagnostico;

ALTER TABLE public.reparacion
  ADD COLUMN IF NOT EXISTS id_albaran BIGINT,
  ADD COLUMN IF NOT EXISTS id_user_asignado BIGINT,
  ADD COLUMN IF NOT EXISTS solucion_aplicada TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

DO $$
DECLARE
  cname TEXT;
BEGIN

  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.reparacion'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%(id_user)%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.reparacion DROP CONSTRAINT %I', cname);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='reparacion'
      AND column_name='id_user'
  ) THEN
    EXECUTE 'ALTER TABLE public.reparacion DROP COLUMN id_user';
  END IF;
END $$;

ALTER TABLE public.reparacion
  DROP CONSTRAINT IF EXISTS chk_reparacion_estado;

ALTER TABLE public.reparacion
  ADD CONSTRAINT chk_reparacion_estado
  CHECK (
    estado IN (
      'CREADA',
      'ASIGNADA',
      'PENDIENTE_PRESUPUESTO',
      'PENDIENTE_ACEPTACION',
      'PRESUPUESTO_ACEPTADO',
      'TERMINADA',
      'CANCELADA'
    )
  );

ALTER TABLE public.reparacion
  ALTER COLUMN id_albaran SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reparacion_maquina'
  ) THEN
    ALTER TABLE public.reparacion
      ADD CONSTRAINT fk_reparacion_maquina
      FOREIGN KEY (id_maquina)
      REFERENCES public.maquina (id_maquina)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reparacion_albaran'
  ) THEN
    ALTER TABLE public.reparacion
      ADD CONSTRAINT fk_reparacion_albaran
      FOREIGN KEY (id_albaran)
      REFERENCES public.albaran (id_albaran)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_reparacion_user_asignado'
  ) THEN
    ALTER TABLE public.reparacion
      ADD CONSTRAINT fk_reparacion_user_asignado
      FOREIGN KEY (id_user_asignado)
      REFERENCES public.users (id_user)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ux_reparacion_id_albaran'
  ) THEN
    ALTER TABLE public.reparacion
      ADD CONSTRAINT ux_reparacion_id_albaran UNIQUE (id_albaran);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reparacion_id_maquina
  ON public.reparacion (id_maquina);

CREATE INDEX IF NOT EXISTS idx_reparacion_id_user_asignado
  ON public.reparacion (id_user_asignado);

COMMIT;