CREATE TABLE IF NOT EXISTS users (
  id_user SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tecnico')),
  nombre TEXT NOT NULL,
  telefono TEXT
);
