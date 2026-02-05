CREATE TABLE propuesta_alquiler (
    id BIGSERIAL PRIMARY KEY,

    id_maquina INTEGER NOT NULL,

    cliente TEXT NOT NULL,
    email_cliente TEXT NOT NULL,
    telefono TEXT NOT NULL,

    direccion TEXT NOT NULL,
    cp TEXT NOT NULL,
    poblacion TEXT NOT NULL,

    precio NUMERIC(10,2) NOT NULL,

    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    estado TEXT NOT NULL,
    token_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_propuesta_maquina
        FOREIGN KEY (id_maquina)
        REFERENCES maquina (id_maquina)
        ON DELETE RESTRICT,

    CONSTRAINT chk_propuesta_estado
        CHECK (estado IN ('PENDING', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA')),

    CONSTRAINT chk_propuesta_fechas
        CHECK (fecha_fin >= fecha_inicio)
);