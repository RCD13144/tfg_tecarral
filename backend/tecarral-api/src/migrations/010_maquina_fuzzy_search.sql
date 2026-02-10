CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE maquina
ADD COLUMN search_text TEXT;


CREATE OR REPLACE FUNCTION maquina_search_text(m maquina)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        COALESCE(m.marca,'') || ' ' ||
        COALESCE(m.modelo,'') || ' ' ||
        COALESCE(m.tipo_maquina,'') || ' ' ||
        COALESCE(m.tipo,'') || ' ' ||
        COALESCE(m.availability_status,'') || ' ' ||
        COALESCE(m.ubicacion,'')
    );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION maquina_search_text_trigger()
RETURNS trigger AS $$
BEGIN
    NEW.search_text = maquina_search_text(NEW);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maquina_search_text_update
BEFORE INSERT OR UPDATE ON maquina
FOR EACH ROW
EXECUTE FUNCTION maquina_search_text_trigger();


UPDATE maquina SET search_text = maquina_search_text(maquina);

CREATE INDEX maquina_search_text_trgm_idx
ON maquina USING gin (search_text gin_trgm_ops);
