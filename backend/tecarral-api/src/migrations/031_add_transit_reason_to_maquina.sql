ALTER TABLE maquina
ADD COLUMN IF NOT EXISTS transit_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_maquina_transit_reason'
  ) THEN
    ALTER TABLE maquina
    ADD CONSTRAINT chk_maquina_transit_reason
    CHECK (
      transit_reason IS NULL
      OR transit_reason IN ('REPARACION_TERMINADA', 'ALQUILER_FINALIZADO')
    );
  END IF;
END $$;

UPDATE maquina m
SET transit_reason = 'ALQUILER_FINALIZADO'
WHERE m.ubicacion_tipo = 'TRANSITO'
  AND COALESCE(m.logistics_status, '') = 'EN_CAMINO'
  AND EXISTS (
    SELECT 1
    FROM propuesta_alquiler p
    WHERE p.id_maquina = m.id_maquina
      AND p.estado = 'FINALIZADA'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM propuesta_alquiler pa
    WHERE pa.id_maquina = m.id_maquina
      AND pa.estado = 'ACEPTADA'
  );
