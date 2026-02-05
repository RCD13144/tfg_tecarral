ALTER TABLE public.maquina
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'DISPONIBLE',
  ADD COLUMN IF NOT EXISTS maintenance_status  TEXT NOT NULL DEFAULT 'OK',
  ADD COLUMN IF NOT EXISTS logistics_status    TEXT NULL,
  ADD COLUMN IF NOT EXISTS ubicacion_tipo      TEXT NOT NULL DEFAULT 'DESCONOCIDA',
  ADD COLUMN IF NOT EXISTS ubicacion_ref_id    BIGINT NULL;

  DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_maquina_availability_status'
  ) THEN
    ALTER TABLE public.maquina
      ADD CONSTRAINT chk_maquina_availability_status
      CHECK (availability_status IN ('DISPONIBLE', 'SOLICITADA', 'ALQUILADA'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_maquina_maintenance_status'
  ) THEN
    ALTER TABLE public.maquina
      ADD CONSTRAINT chk_maquina_maintenance_status
      CHECK (maintenance_status IN ('OK', 'AVERIADA', 'EN_TALLER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_maquina_logistics_status'
  ) THEN
    ALTER TABLE public.maquina
      ADD CONSTRAINT chk_maquina_logistics_status
      CHECK (logistics_status IS NULL OR logistics_status IN ('EN_CAMINO', 'ENTREGADA'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_maquina_ubicacion_tipo'
  ) THEN
    ALTER TABLE public.maquina
      ADD CONSTRAINT chk_maquina_ubicacion_tipo
      CHECK (ubicacion_tipo IN ('DESCONOCIDA', 'TALLER', 'ALMACEN', 'CLIENTE', 'TRANSITO'));
  END IF;
END $$;



