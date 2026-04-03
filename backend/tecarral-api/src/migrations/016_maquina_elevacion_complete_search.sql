CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE maquina_elevacion
  ADD COLUMN IF NOT EXISTS search_text   TEXT,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION maquina_elevacion_build_search_text(me maquina_elevacion)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    COALESCE(me.ruedas::text,'') || ' ' ||
    COALESCE(me.cap_carga::text,'') || ' ' ||
    COALESCE(me.replegado_mm::text,'') || ' ' ||
    COALESCE(CASE WHEN me.elevacion_libre THEN 'si' ELSE 'no' END, '') || ' ' ||
    COALESCE(me.elevacion::text,'') || ' ' ||
    COALESCE(me.desplazamiento::text,'') || ' ' ||
    COALESCE(me.posicion::text,'') || ' ' ||
    COALESCE(me.antihuella::text,'') || ' ' ||
    COALESCE(me.matricula::text,'') || ' ' ||
    COALESCE(me.largo::text,'') || ' ' ||
    COALESCE(me.alto::text,'') || ' ' ||
    COALESCE(me.ancho::text,'') || ' ' ||
    COALESCE(me.peso_kg::text,'') || ' ' ||
    COALESCE(me.horquillas::text,'')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maquina_elevacion_build_search_vector(me maquina_elevacion)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector(
    'spanish',
    unaccent(
      maquina_elevacion_build_search_text(me)
    )
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maquina_elevacion_search_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_text = maquina_elevacion_build_search_text(NEW);
  NEW.search_vector = maquina_elevacion_build_search_vector(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maquina_elevacion_search ON maquina_elevacion;

CREATE TRIGGER trg_maquina_elevacion_search
BEFORE INSERT OR UPDATE ON maquina_elevacion
FOR EACH ROW
EXECUTE FUNCTION maquina_elevacion_search_trigger();

UPDATE maquina_elevacion
SET
  search_text = maquina_elevacion_build_search_text(maquina_elevacion),
  search_vector = maquina_elevacion_build_search_vector(maquina_elevacion);

CREATE INDEX IF NOT EXISTS maquina_elevacion_search_text_trgm_idx
ON maquina_elevacion USING gin (search_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS maquina_elevacion_search_vector_idx
ON maquina_elevacion USING gin (search_vector);
