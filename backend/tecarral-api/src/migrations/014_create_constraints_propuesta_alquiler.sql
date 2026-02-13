BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS propuesta_alquiler_token_hash_uq
  ON propuesta_alquiler (token_hash);

CREATE INDEX IF NOT EXISTS propuesta_alquiler_maquina_estado_idx
  ON propuesta_alquiler (id_maquina, estado);

CREATE INDEX IF NOT EXISTS propuesta_alquiler_estado_expires_at_idx
  ON propuesta_alquiler (estado, expires_at);

ALTER TABLE propuesta_alquiler
  DROP CONSTRAINT IF EXISTS chk_propuesta_fechas;

ALTER TABLE propuesta_alquiler
  ADD CONSTRAINT chk_propuesta_fechas
  CHECK (fecha_fin > fecha_inicio);

ALTER TABLE propuesta_alquiler
  ALTER COLUMN estado SET DEFAULT 'PENDING';

COMMIT;
