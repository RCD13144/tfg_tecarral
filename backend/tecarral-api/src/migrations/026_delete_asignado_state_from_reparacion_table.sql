BEGIN;

ALTER TABLE public.reparacion
  DROP CONSTRAINT IF EXISTS chk_reparacion_estado;

ALTER TABLE public.reparacion
  ADD CONSTRAINT chk_reparacion_estado
  CHECK (
    estado IN (
      'CREADA',
      'PENDIENTE_PRESUPUESTO',
      'PENDIENTE_ACEPTACION',
      'PRESUPUESTO_ACEPTADO',
      'TERMINADA',
      'CANCELADA'
    )
  );

COMMIT;