BEGIN;

UPDATE public.maquina
SET maintenance_status = 'AVERIADA_GRAVE'
WHERE maintenance_status = 'EN_TALLER';

ALTER TABLE public.maquina
DROP CONSTRAINT IF EXISTS chk_maquina_maintenance_status;

ALTER TABLE public.maquina
ADD CONSTRAINT chk_maquina_maintenance_status
CHECK (
  maintenance_status IN ('OK', 'AVERIADA', 'AVERIADA_GRAVE')
);

ALTER TABLE public.maquina
ALTER COLUMN maintenance_status SET NOT NULL;

COMMIT;