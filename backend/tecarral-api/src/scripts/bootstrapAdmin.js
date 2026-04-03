import pg from "pg";
import { hashPassword } from "../utils/password.js";

function buildClient() {
  return new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} es obligatorio`);
  }

  return value.trim();
}

function generateTemporaryPassword(length = 14) {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*";
  const allChars = uppercase + lowercase + digits + symbols;

  const passwordChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  while (passwordChars.length < length) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    passwordChars.push(allChars[randomIndex]);
  }

  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const current = passwordChars[i];
    passwordChars[i] = passwordChars[randomIndex];
    passwordChars[randomIndex] = current;
  }

  return passwordChars.join("");
}

async function adminAlreadyExists(client) {
  const query = `
    SELECT 1
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1
  `;

  const result = await client.query(query);
  return result.rows.length > 0;
}

async function createBootstrapAdmin(client, adminData) {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const insertQuery = `
    INSERT INTO public.users (
      email,
      password_hash,
      role,
      nombre,
      telefono,
      must_change_password
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_user, email, role, nombre, telefono, must_change_password
  `;

  const result = await client.query(insertQuery, [
    adminData.email,
    passwordHash,
    adminData.role,
    adminData.nombre,
    adminData.telefono,
    true,
  ]);

  return {
    user: result.rows[0],
    temporaryPassword,
  };
}

async function main() {
  const email = getRequiredEnv("BOOTSTRAP_ADMIN_EMAIL");
  const nombre = getRequiredEnv("BOOTSTRAP_ADMIN_NOMBRE");
  const telefono = getRequiredEnv("BOOTSTRAP_ADMIN_TELEFONO");
  const role = (process.env.BOOTSTRAP_ADMIN_ROLE || "admin").trim();

  if (role !== "admin") {
    throw new Error("BOOTSTRAP_ADMIN_ROLE debe ser 'admin'");
  }

  const client = buildClient();
  await client.connect();

  try {
    await client.query("BEGIN");

    const exists = await adminAlreadyExists(client);

    if (exists) {
      await client.query("ROLLBACK");
      console.log("Ya existe al menos un usuario admin. Bootstrap omitido.");
      return;
    }

    const created = await createBootstrapAdmin(client, {
      email,
      nombre,
      telefono,
      role,
    });

    await client.query("COMMIT");

    console.log("Admin bootstrap creado correctamente.");
    console.log(`Email: ${created.user.email}`);
    console.log(`Password temporal: ${created.temporaryPassword}`);
    console.log("Debe cambiar la contraseña en el primer acceso.");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
    }

    console.error("Error creando admin bootstrap:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();