ALTER TABLE public.formal_document
  ADD COLUMN IF NOT EXISTS pdf_content BYTEA,
  ADD COLUMN IF NOT EXISTS pdf_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS pdf_filename TEXT,
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_version INTEGER;

CREATE TABLE IF NOT EXISTS public.formal_document_delivery (
  id BIGSERIAL PRIMARY KEY,
  formal_document_id BIGINT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_formal_document_delivery_document
    FOREIGN KEY (formal_document_id)
    REFERENCES public.formal_document (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_formal_document_delivery_recipient_type
    CHECK (recipient_type IN ('CUSTOMER', 'INTERNAL')),
  CONSTRAINT chk_formal_document_delivery_status
    CHECK (status IN ('PENDING', 'SENT', 'ERROR')),
  CONSTRAINT chk_formal_document_delivery_attempts
    CHECK (attempts >= 0),
  CONSTRAINT ux_formal_document_delivery_recipient
    UNIQUE (formal_document_id, recipient_type)
);

CREATE INDEX IF NOT EXISTS idx_formal_document_delivery_status
  ON public.formal_document_delivery (status, updated_at DESC);
