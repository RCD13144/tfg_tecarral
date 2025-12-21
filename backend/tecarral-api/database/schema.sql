CREATE TABLE IF NOT EXISTS users (
  id_user SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tecnico',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
