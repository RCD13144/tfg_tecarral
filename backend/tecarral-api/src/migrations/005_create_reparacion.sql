CREATE TABLE reparacion (
    id_reparacion BIGSERIAL PRIMARY KEY,

    id_maquina INTEGER NOT NULL,
    id_user INTEGER NOT NULL,

    comentario TEXT,
    estado TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_reparacion_maquina
        FOREIGN KEY (id_maquina)
        REFERENCES maquina (id_maquina)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reparacion_user
        FOREIGN KEY (id_user)
        REFERENCES users (id_user)
        ON DELETE RESTRICT,

    CONSTRAINT chk_reparacion_estado
        CHECK (estado IN ('ASIGNADO'))
);
