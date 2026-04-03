ALTER TABLE propuesta_alquiler
  ALTER COLUMN fecha_inicio TYPE timestamptz USING (fecha_inicio::timestamptz),
  ALTER COLUMN fecha_fin TYPE timestamptz USING (fecha_fin::timestamptz);
