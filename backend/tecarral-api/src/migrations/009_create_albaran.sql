CREATE TABLE IF NOT EXISTS public.albaran (
  id_albaran BIGSERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL,
  id_maquina BIGINT NOT NULL,
  id_reparacion BIGINT NULL,

  cliente     TEXT NOT NULL,
  direccion   TEXT NOT NULL,
  poblacion   TEXT NOT NULL,
  cp          TEXT NOT NULL,
  telefono    TEXT NULL,
  email_cliente TEXT NOT NULL,

  marca  TEXT NULL,
  modelo TEXT NULL,
  ns     TEXT NULL,

  observaciones TEXT NULL,

  firma_cliente BYTEA NOT NULL,
  firma_tecnico BYTEA NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_albaran_user
    FOREIGN KEY (id_user)
    REFERENCES public.users (id_user)
    ON DELETE RESTRICT,

  CONSTRAINT fk_albaran_maquina
    FOREIGN KEY (id_maquina)
    REFERENCES public.maquina (id_maquina)
    ON DELETE RESTRICT,

  CONSTRAINT fk_albaran_reparacion
    FOREIGN KEY (id_reparacion)
    REFERENCES public.reparacion (id_reparacion)
    ON DELETE SET NULL,

  CONSTRAINT uq_albaran_reparacion UNIQUE (id_reparacion),

  CONSTRAINT chk_albaran_email_no_vacio
    CHECK (length(trim(email_cliente)) > 0),

  CONSTRAINT chk_albaran_cp_no_vacio
    CHECK (length(trim(cp)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_albaran_user ON public.albaran (id_user);
CREATE INDEX IF NOT EXISTS idx_albaran_maquina ON public.albaran (id_maquina);
CREATE INDEX IF NOT EXISTS idx_albaran_created_at ON public.albaran (created_at DESC);
