ALTER TABLE propuesta_alquiler
  DROP CONSTRAINT IF EXISTS chk_propuesta_estado;

ALTER TABLE propuesta_alquiler
  ADD CONSTRAINT chk_propuesta_estado
  CHECK (estado IN ('PENDING','ACEPTADA','RECHAZADA','EXPIRADA','FINALIZADA'));
