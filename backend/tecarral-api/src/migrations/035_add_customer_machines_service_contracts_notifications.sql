BEGIN;

ALTER TABLE public.maquina
  ADD COLUMN IF NOT EXISTS ownership_type TEXT NOT NULL DEFAULT 'TECARRAL',
  ADD COLUMN IF NOT EXISTS owner_cliente_nombre TEXT,
  ADD COLUMN IF NOT EXISTS owner_cliente_email TEXT,
  ADD COLUMN IF NOT EXISTS owner_cliente_telefono TEXT,
  ADD COLUMN IF NOT EXISTS owner_cliente_direccion TEXT,
  ADD COLUMN IF NOT EXISTS owner_cliente_poblacion TEXT,
  ADD COLUMN IF NOT EXISTS owner_cliente_cp TEXT,
  ADD COLUMN IF NOT EXISTS service_contract_id BIGINT;

ALTER TABLE public.maquina
  DROP CONSTRAINT IF EXISTS chk_maquina_ownership_type;

ALTER TABLE public.maquina
  ADD CONSTRAINT chk_maquina_ownership_type
  CHECK (ownership_type IN ('TECARRAL', 'CLIENTE'));

CREATE TABLE IF NOT EXISTS public.service_contract (
  id BIGSERIAL PRIMARY KEY,
  contract_type TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'BORRADOR',
  public_token_hash TEXT,
  titulo TEXT,
  descripcion TEXT,
  tarifa_fija NUMERIC(12,2) NOT NULL DEFAULT 0,
  recurrencia_valor INTEGER NOT NULL DEFAULT 1,
  recurrencia_unidad TEXT NOT NULL DEFAULT 'MONTH',
  maintenance_day_of_month INTEGER,
  maintenance_weekday INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefono TEXT,
  cliente_direccion TEXT,
  cliente_poblacion TEXT,
  cliente_cp TEXT,
  condiciones TEXT,
  snapshot_html TEXT,
  activated_at TIMESTAMPTZ,
  created_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_service_contract_type
    CHECK (contract_type IN ('PREVENTIVO', 'TODO_INCLUIDO')),
  CONSTRAINT chk_service_contract_estado
    CHECK (
      estado IN (
        'BORRADOR',
        'PENDIENTE_FIRMA_CLIENTE',
        'PENDIENTE_FIRMA_TECARRAL',
        'ACTIVO',
        'CANCELADO',
        'VENCIDO'
      )
    ),
  CONSTRAINT chk_service_contract_recurrencia_unidad
    CHECK (recurrencia_unidad IN ('DAY', 'WEEK', 'MONTH', 'YEAR')),
  CONSTRAINT chk_service_contract_recurrencia_valor
    CHECK (recurrencia_valor > 0),
  CONSTRAINT chk_service_contract_weekday
    CHECK (maintenance_weekday IS NULL OR maintenance_weekday BETWEEN 0 AND 6),
  CONSTRAINT chk_service_contract_day_of_month
    CHECK (maintenance_day_of_month IS NULL OR maintenance_day_of_month BETWEEN 1 AND 31)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_service_contract_public_token_hash
  ON public.service_contract (public_token_hash)
  WHERE public_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.service_contract_machine (
  id BIGSERIAL PRIMARY KEY,
  service_contract_id BIGINT NOT NULL,
  id_maquina BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_service_contract_machine_contract
    FOREIGN KEY (service_contract_id)
    REFERENCES public.service_contract (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_service_contract_machine_maquina
    FOREIGN KEY (id_maquina)
    REFERENCES public.maquina (id_maquina)
    ON DELETE CASCADE,
  CONSTRAINT ux_service_contract_machine UNIQUE (service_contract_id, id_maquina)
);

CREATE TABLE IF NOT EXISTS public.service_contract_signature (
  id BIGSERIAL PRIMARY KEY,
  service_contract_id BIGINT NOT NULL,
  signer_type TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signature_image BYTEA NOT NULL,
  signature_mime TEXT NOT NULL DEFAULT 'image/png',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_service_contract_signature_contract
    FOREIGN KEY (service_contract_id)
    REFERENCES public.service_contract (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_service_contract_signature_signer_type
    CHECK (signer_type IN ('CLIENTE', 'TECARRAL')),
  CONSTRAINT ux_service_contract_signature_signer_type
    UNIQUE (service_contract_id, signer_type)
);

CREATE TABLE IF NOT EXISTS public.service_visit_schedule (
  id BIGSERIAL PRIMARY KEY,
  service_contract_id BIGINT NOT NULL,
  id_maquina BIGINT NOT NULL,
  scheduled_for DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  completed_at TIMESTAMPTZ,
  completed_by BIGINT,
  notes TEXT,
  reminder_week_before_sent_at TIMESTAMPTZ,
  reminder_same_day_sent_at TIMESTAMPTZ,
  reminder_two_days_after_sent_at TIMESTAMPTZ,
  reminder_week_after_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_service_visit_schedule_contract
    FOREIGN KEY (service_contract_id)
    REFERENCES public.service_contract (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_service_visit_schedule_maquina
    FOREIGN KEY (id_maquina)
    REFERENCES public.maquina (id_maquina)
    ON DELETE CASCADE,
  CONSTRAINT chk_service_visit_schedule_estado
    CHECK (estado IN ('PENDIENTE', 'REALIZADA', 'OMITIDA', 'REPROGRAMADA', 'VENCIDA')),
  CONSTRAINT ux_service_visit_schedule_machine_date UNIQUE (service_contract_id, id_maquina, scheduled_for)
);

CREATE TABLE IF NOT EXISTS public.notification (
  id BIGSERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL,
  tipo TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id BIGINT,
  dedupe_key TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notification_user
    FOREIGN KEY (id_user)
    REFERENCES public.users (id_user)
    ON DELETE CASCADE,
  CONSTRAINT chk_notification_tipo
    CHECK (
      tipo IN (
        'MANTENIMIENTO_PROXIMO',
        'MANTENIMIENTO_HOY',
        'MANTENIMIENTO_ATRASADO_2_DIAS',
        'MANTENIMIENTO_ATRASADO_7_DIAS',
        'CONTRATO_FIRMADO',
        'PRESUPUESTO_PENDIENTE_FIRMA'
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_notification_dedupe_key
  ON public.notification (id_user, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_user_unread
  ON public.notification (id_user, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.loaner_assignment (
  id BIGSERIAL PRIMARY KEY,
  reparacion_id BIGINT NOT NULL,
  customer_machine_id BIGINT NOT NULL,
  loaner_machine_id BIGINT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'RESERVADA',
  motivo TEXT,
  delivered_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_loaner_assignment_reparacion
    FOREIGN KEY (reparacion_id)
    REFERENCES public.reparacion (id_reparacion)
    ON DELETE CASCADE,
  CONSTRAINT fk_loaner_assignment_customer_machine
    FOREIGN KEY (customer_machine_id)
    REFERENCES public.maquina (id_maquina)
    ON DELETE RESTRICT,
  CONSTRAINT fk_loaner_assignment_loaner_machine
    FOREIGN KEY (loaner_machine_id)
    REFERENCES public.maquina (id_maquina)
    ON DELETE RESTRICT,
  CONSTRAINT chk_loaner_assignment_estado
    CHECK (estado IN ('RESERVADA', 'ENTREGADA', 'DEVUELTA', 'CANCELADA')),
  CONSTRAINT ux_loaner_assignment_reparacion UNIQUE (reparacion_id)
);

ALTER TABLE public.maquina
  DROP CONSTRAINT IF EXISTS fk_maquina_service_contract;

ALTER TABLE public.maquina
  ADD CONSTRAINT fk_maquina_service_contract
  FOREIGN KEY (service_contract_id)
  REFERENCES public.service_contract (id)
  ON DELETE SET NULL;

ALTER TABLE public.reparacion
  ADD COLUMN IF NOT EXISTS service_context_type TEXT,
  ADD COLUMN IF NOT EXISTS service_context_id BIGINT;

ALTER TABLE public.reparacion
  DROP CONSTRAINT IF EXISTS chk_reparacion_service_context_type;

ALTER TABLE public.reparacion
  ADD CONSTRAINT chk_reparacion_service_context_type
  CHECK (
    service_context_type IS NULL
    OR service_context_type IN ('ALQUILER', 'CONTRATO_MANTENIMIENTO', 'REPARACION_PUNTUAL_CLIENTE')
  );

ALTER TABLE public.albaran
  ALTER COLUMN propuesta_alquiler_id DROP NOT NULL;

ALTER TABLE public.albaran
  ADD COLUMN IF NOT EXISTS service_context_type TEXT,
  ADD COLUMN IF NOT EXISTS service_context_id BIGINT;

ALTER TABLE public.albaran
  DROP CONSTRAINT IF EXISTS chk_albaran_service_context_type;

ALTER TABLE public.albaran
  ADD CONSTRAINT chk_albaran_service_context_type
  CHECK (
    service_context_type IS NULL
    OR service_context_type IN ('ALQUILER', 'CONTRATO_MANTENIMIENTO', 'REPARACION_PUNTUAL_CLIENTE')
  );

ALTER TABLE public.presupuesto_reparacion
  ALTER COLUMN propuesta_alquiler_id DROP NOT NULL;

ALTER TABLE public.presupuesto_reparacion
  ADD COLUMN IF NOT EXISTS coverage_decision TEXT,
  ADD COLUMN IF NOT EXISTS coverage_reason TEXT,
  ADD COLUMN IF NOT EXISTS firma_cliente BYTEA,
  ADD COLUMN IF NOT EXISTS firma_cliente_mime TEXT,
  ADD COLUMN IF NOT EXISTS firmado_cliente_nombre TEXT,
  ADD COLUMN IF NOT EXISTS firmado_cliente_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS firma_cliente_ip TEXT;

UPDATE public.presupuesto_reparacion
SET coverage_decision = COALESCE(
  coverage_decision,
  CASE
    WHEN payer_type = 'EMPRESA' THEN 'TECARRAL'
    ELSE 'CLIENTE'
  END
);

UPDATE public.presupuesto_reparacion
SET coverage_reason = COALESCE(
  coverage_reason,
  CASE
    WHEN payer_type = 'EMPRESA' THEN 'TODO_INCLUIDO'
    WHEN charge_reason = 'GOLPE_ACCIDENTE' THEN 'GOLPE_ACCIDENTE'
    ELSE 'REPARACION_PUNTUAL'
  END
);

ALTER TABLE public.presupuesto_reparacion
  ALTER COLUMN coverage_decision SET NOT NULL;

ALTER TABLE public.presupuesto_reparacion
  ALTER COLUMN coverage_reason SET NOT NULL;

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_coverage_decision;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT chk_presupuesto_reparacion_coverage_decision
  CHECK (coverage_decision IN ('CLIENTE', 'TECARRAL'));

ALTER TABLE public.presupuesto_reparacion
  DROP CONSTRAINT IF EXISTS chk_presupuesto_reparacion_coverage_reason;

ALTER TABLE public.presupuesto_reparacion
  ADD CONSTRAINT chk_presupuesto_reparacion_coverage_reason
  CHECK (
    coverage_reason IN (
      'PREVENTIVO_NO_CUBRE',
      'TODO_INCLUIDO',
      'GOLPE_ACCIDENTE',
      'REPARACION_PUNTUAL',
      'OTRO'
    )
  );

CREATE INDEX IF NOT EXISTS idx_service_visit_schedule_pending
  ON public.service_visit_schedule (estado, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_loaner_assignment_loaner_machine
  ON public.loaner_assignment (loaner_machine_id, estado);

COMMIT;
