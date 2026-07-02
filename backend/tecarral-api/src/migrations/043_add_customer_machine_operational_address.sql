ALTER TABLE public.maquina
  ADD COLUMN IF NOT EXISTS ubicacion_operativa_direccion TEXT,
  ADD COLUMN IF NOT EXISTS ubicacion_operativa_poblacion TEXT,
  ADD COLUMN IF NOT EXISTS ubicacion_operativa_cp TEXT;

UPDATE public.maquina
SET ubicacion_operativa_direccion = COALESCE(ubicacion_operativa_direccion, ubicacion)
WHERE ownership_type = 'CLIENTE'
  AND ubicacion_operativa_direccion IS NULL
  AND ubicacion IS NOT NULL;
