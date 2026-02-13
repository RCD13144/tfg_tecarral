UPDATE public.maquina
SET ubicacion_tipo = 'DESCONOCIDA'
WHERE ubicacion_tipo IS NULL;

UPDATE public.maquina
SET
  ubicacion = 'Almacén Azuqueca de Henares',
  ubicacion_tipo = 'ALMACEN'
WHERE ubicacion = 'AZU';

UPDATE public.maquina
SET
  ubicacion = 'Taller',
  ubicacion_tipo = 'TALLER'
WHERE ubicacion = 'MECO';
