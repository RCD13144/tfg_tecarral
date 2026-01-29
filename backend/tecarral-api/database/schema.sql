CREATE TABLE IF NOT EXISTS maquina (
  id_maquina BIGSERIAL PRIMARY KEY,
  tipo TEXT,
  marca TEXT,
  motor TEXT,
  modelo TEXT,
  ns TEXT,
  seguro BOOLEAN,
  num_poliza TEXT,
  alquilada BOOLEAN,
  ubicacion TEXT,
  observaciones TEXT
);

CREATE TABLE IF NOT EXISTS maquina_elevacion (
  id_maquina BIGINT PRIMARY KEY REFERENCES maquina(id_maquina) ON DELETE CASCADE,
  ruedas TEXT,
  cap_carga TEXT,
  replegado_mm INTEGER,
  elevacion_libre BOOLEAN,
  elevacion TEXT,
  desplazamiento TEXT,
  posicion TEXT,
  antihuella TEXT,
  matricula TEXT,
  largo NUMERIC(10,2),
  alto  NUMERIC(10,2),
  ancho NUMERIC(10,2),
  peso_kg NUMERIC(10,2),
  horquillas TEXT
);
