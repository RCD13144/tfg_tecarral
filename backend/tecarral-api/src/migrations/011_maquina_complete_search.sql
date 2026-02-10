ALTER TABLE maquina
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION maquina_build_search_vector(m maquina)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector(
    'spanish',
    lower(
      coalesce(m.marca,'') || ' ' ||
      coalesce(m.modelo,'') || ' ' ||
      coalesce(m.tipo_maquina,'') || ' ' ||
      coalesce(m.tipo,'') || ' ' ||
      coalesce(m.availability_status,'') || ' ' ||
      coalesce(m.ubicacion,'')
    )
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maquina_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector = maquina_build_search_vector(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maquina_search_vector_update ON maquina;

CREATE TRIGGER maquina_search_vector_update
BEFORE INSERT OR UPDATE ON maquina
FOR EACH ROW
EXECUTE FUNCTION maquina_search_vector_trigger();

UPDATE maquina
SET search_vector = maquina_build_search_vector(maquina);

CREATE INDEX IF NOT EXISTS maquina_search_vector_idx
ON maquina USING GIN(search_vector);
