CREATE OR REPLACE FUNCTION maquina_elevacion_build_search_text(me maquina_elevacion)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    'ruedas ' || COALESCE(me.ruedas::text,'') || ' ' ||
    'capacidad de carga ' || COALESCE(me.cap_carga::text,'') || ' ' ||
    'cap_carga ' || COALESCE(me.cap_carga::text,'') || ' ' ||
    'replegado ' || COALESCE(me.replegado_mm::text,'') || ' ' ||
    'elevacion libre ' || COALESCE(me.elevacion_libre::text,'') || ' ' ||
    'elevacion ' || COALESCE(me.elevacion::text,'') || ' ' ||
    'desplazamiento ' || COALESCE(me.desplazamiento::text,'') || ' ' ||
    'posicion ' || COALESCE(me.posicion::text,'') || ' ' ||
    'antihuella ' || COALESCE(me.antihuella::text,'') || ' ' ||
    'matricula ' || COALESCE(me.matricula::text,'') || ' ' ||
    'largo ' || COALESCE(me.largo::text,'') || ' ' ||
    'alto ' || COALESCE(me.alto::text,'') || ' ' ||
    'ancho ' || COALESCE(me.ancho::text,'') || ' ' ||
    'peso ' || COALESCE(me.peso_kg::text,'') || ' ' ||
    'peso_kg ' || COALESCE(me.peso_kg::text,'') || ' ' ||
    'horquillas ' || COALESCE(me.horquillas::text,'')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maquina_elevacion_build_search_vector(me maquina_elevacion)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('spanish', unaccent(maquina_elevacion_build_search_text(me)));
END;
$$ LANGUAGE plpgsql;

UPDATE maquina_elevacion
SET
  search_text = maquina_elevacion_build_search_text(maquina_elevacion),
  search_vector = maquina_elevacion_build_search_vector(maquina_elevacion);
