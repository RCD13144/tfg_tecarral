BEGIN;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS propuesta_alquiler_id BIGINT;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS cliente TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS poblacion TEXT,
  ADD COLUMN IF NOT EXISTS cp TEXT,
  ADD COLUMN IF NOT EXISTS email_cliente TEXT;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS ns TEXT;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS firma_cliente BYTEA,
  ADD COLUMN IF NOT EXISTS firma_tecnico BYTEA;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS firma_cliente_mime TEXT DEFAULT 'image/png',
  ADD COLUMN IF NOT EXISTS firma_tecnico_mime TEXT DEFAULT 'image/png';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_albaran_maquina'
  ) THEN
    ALTER TABLE public.albaran
      ADD CONSTRAINT fk_albaran_maquina
      FOREIGN KEY (id_maquina)
      REFERENCES public.maquina (id_maquina)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_albaran_user'
  ) THEN
    ALTER TABLE public.albaran
      ADD CONSTRAINT fk_albaran_user
      FOREIGN KEY (id_user)
      REFERENCES public.users (id_user)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_albaran_propuesta_alquiler'
  ) THEN
    ALTER TABLE public.albaran
      ADD CONSTRAINT fk_albaran_propuesta_alquiler
      FOREIGN KEY (propuesta_alquiler_id)
      REFERENCES public.propuesta_alquiler (id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_albaran_propuesta_alquiler_id
  ON public.albaran (propuesta_alquiler_id);

CREATE INDEX IF NOT EXISTS idx_albaran_id_maquina
  ON public.albaran (id_maquina);

CREATE INDEX IF NOT EXISTS idx_albaran_id_user
  ON public.albaran (id_user);

COMMIT;