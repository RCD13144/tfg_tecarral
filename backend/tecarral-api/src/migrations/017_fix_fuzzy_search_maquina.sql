CREATE OR REPLACE FUNCTION maquina_search_text(m maquina)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    'tipo ' || COALESCE(m.tipo,'') || ' ' ||
    'marca ' || COALESCE(m.marca,'') || ' ' ||
    'motor ' || COALESCE(m.motor,'') || ' ' ||
    'modelo ' || COALESCE(m.modelo,'') || ' ' ||
    'ns ' || COALESCE(m.ns,'') || ' ' ||
    'seguro ' || COALESCE(m.seguro::text,'') || ' ' ||
    'poliza ' || COALESCE(m.num_poliza,'') || ' ' ||
    'ubicacion ' || COALESCE(m.ubicacion,'') || ' ' ||
    'observaciones ' || COALESCE(m.observaciones,'') || ' ' ||
    'tipo maquina ' || COALESCE(m.tipo_maquina,'') || ' ' ||
    'disponibilidad ' || COALESCE(m.availability_status,'') || ' ' ||
    'mantenimiento ' || COALESCE(m.maintenance_status,'') || ' ' ||
    'logistica ' || COALESCE(m.logistics_status,'') || ' ' ||
    'ubicacion tipo ' || COALESCE(m.ubicacion_tipo,'')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maquina_build_search_vector(m maquina)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('spanish', unaccent(maquina_search_text(m)));
END;
$$ LANGUAGE plpgsql;

UPDATE maquina
SET
  search_text = maquina_search_text(maquina),
  search_vector = maquina_build_search_vector(maquina);
