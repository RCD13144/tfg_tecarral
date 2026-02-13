BEGIN;

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION maquina_build_search_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_text :=
        LOWER(unaccent(
            COALESCE(NEW.marca,'') || ' ' ||
            COALESCE(NEW.modelo,'') || ' ' ||
            COALESCE(NEW.tipo_maquina,'') || ' ' ||
            COALESCE(NEW.tipo,'') || ' ' ||
            COALESCE(NEW.availability_status,'') || ' ' ||
            COALESCE(NEW.ubicacion,'')
        ));

    NEW.search_vector :=
        to_tsvector('spanish', NEW.search_text);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS maquina_search_trigger ON maquina;

CREATE TRIGGER maquina_search_trigger
BEFORE INSERT OR UPDATE ON maquina
FOR EACH ROW
EXECUTE FUNCTION maquina_build_search_fields();

DROP INDEX IF EXISTS maquina_search_idx;

CREATE INDEX maquina_search_idx
ON maquina
USING GIN (search_vector);

UPDATE maquina
SET marca = marca;

COMMIT;
