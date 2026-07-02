CREATE TABLE IF NOT EXISTS public.user_push_token (
  id BIGSERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL,
  expo_push_token TEXT NOT NULL,
  platform TEXT,
  device_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_error TEXT,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_push_token_user
    FOREIGN KEY (id_user)
    REFERENCES public.users (id_user)
    ON DELETE CASCADE,
  CONSTRAINT ux_user_push_token_token UNIQUE (expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_token_user_active
  ON public.user_push_token (id_user, is_active);

CREATE TABLE IF NOT EXISTS public.notification_push_delivery (
  id BIGSERIAL PRIMARY KEY,
  notification_id BIGINT,
  user_push_token_id BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  expo_ticket_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notification_push_delivery_notification
    FOREIGN KEY (notification_id)
    REFERENCES public.notification (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notification_push_delivery_token
    FOREIGN KEY (user_push_token_id)
    REFERENCES public.user_push_token (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_notification_push_delivery_status
    CHECK (status IN ('PENDING', 'SENT', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_notification_push_delivery_status
  ON public.notification_push_delivery (status, updated_at DESC);
