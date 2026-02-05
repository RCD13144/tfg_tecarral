CREATE TABLE IF NOT EXISTS maquina (
  id_maquina BIGSERIAL PRIMARY KEY,
  tipo_maquina TEXT NOT NULL
    CHECK (tipo_maquina IN ('elevacion', 'limpieza')),
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
