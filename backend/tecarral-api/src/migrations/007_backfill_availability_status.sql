UPDATE public.maquina
SET availability_status = CASE
  WHEN alquilada IS TRUE THEN 'ALQUILADA'
  ELSE 'DISPONIBLE'
END
WHERE availability_status IS NULL
   OR availability_status NOT IN ('DISPONIBLE', 'SOLICITADA', 'ALQUILADA');
