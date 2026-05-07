import { generatePublicToken } from "../utils/publicToken.js";
import { sendMail } from "../utils/mailer.js";
import {
  buildPropuestaEmailHtml,
  buildPropuestaEmailText
} from "../templates/propuestaEmail.template.js";
import {
  crearPropuestaTx,
  findById,
  findByMachineId,
  updatePropuestaPendingById,
  deletePropuestaById,
  expirePendingPropuestasByEndDate,
  finalizeNonPendingPropuestasByEndDate
} from "../repositories/propuesta.repository.js";
import {
  getMaquinaLabelById,
  marcarTransitoPorAlquilerTerminadoTx
} from "../repositories/maquina.repository.js";

const DEFAULT_EXPIRES_HOURS = 48;

export async function crearPropuesta(data) {
  const { token, tokenHash } = generatePublicToken();

  const expiresAt = new Date(
    Date.now() + DEFAULT_EXPIRES_HOURS * 60 * 60 * 1000
  );

  const propuesta = await crearPropuestaTx({
    ...data,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return {
    ...propuesta,
    public_url: `/public/propuestas/${token}`,
  };
}

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export async function editarPropuesta(id, patch) {
  const propuesta = await findById(id);

  if (!propuesta) {
    throw createHttpError(404, "Propuesta no encontrada");
  }

  const expired = new Date(propuesta.expires_at).getTime() <= Date.now();

  if (expired) {
    throw createHttpError(409, "No se puede editar: propuesta expirada");
  }

  if (propuesta.estado !== "PENDING") {
    throw createHttpError(409, "No se puede editar: propuesta no está en PENDING");
  }

  const finalFechaInicio = patch.fecha_inicio ?? propuesta.fecha_inicio;
  const finalFechaFin = patch.fecha_fin ?? propuesta.fecha_fin;

  const ini = new Date(`${finalFechaInicio}T00:00:00Z`).getTime();
  const fin = new Date(`${finalFechaFin}T00:00:00Z`).getTime();

  if (fin <= ini) {
    throw createHttpError(400, "fecha_fin debe ser mayor que fecha_inicio");
  }

  const updated = await updatePropuestaPendingById(id, patch);
  return updated;
}

export async function deletePropuestaFromDB(id) {
  const propuesta = deletePropuestaById(id);
  return propuesta;
}

function getPublicBaseUrl() {
  const base = String(process.env.PUBLIC_BASE_URL ?? "").trim();
  return base.length === 0 ? "http://localhost:3000" : base;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function crearPropuestaIntoDB(body) {
  const { token, tokenHash } = generatePublicToken();
  const expiresAt = addHours(new Date(), 48);

  const propuesta = await crearPropuestaTx({
    ...body,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const maquinaLabel =
    (await getMaquinaLabelById(propuesta.id_maquina)) ?? "Máquina";

  const publicUrl = `${getPublicBaseUrl()}/public/propuestas/${token}`;

  let emailSent = false;
  let emailError = null;

  try {
    const subject = `Propuesta de alquiler - Máquina #${propuesta.id_maquina}`;

    const html = buildPropuestaEmailHtml({
      cliente: propuesta.cliente,
      maquinaLabel,
      fechaInicio: propuesta.fecha_inicio,
      fechaFin: propuesta.fecha_fin,
      precio: propuesta.precio,
      url: publicUrl,
    });

    const text = buildPropuestaEmailText({
      cliente: propuesta.cliente,
      maquinaLabel,
      fechaInicio: propuesta.fecha_inicio,
      fechaFin: propuesta.fecha_fin,
      precio: propuesta.precio,
      url: publicUrl,
    });

    await sendMail({
      to: propuesta.email_cliente,
      subject,
      html,
      text,
    });

    emailSent = true;
  } catch (e) {
    emailSent = false;
    emailError = e?.message ?? "Error enviando email";
  }

  return {
    ...propuesta,
    public_url: publicUrl,
    email_sent: emailSent,
    email_error: emailError,
  };
}

export async function finalizeOrExpirePropuestas() {
  const expired = await expirePendingPropuestasByEndDate();
  const finalized = await finalizeNonPendingPropuestasByEndDate();

  const moved = await marcarTransitoPorAlquilerTerminadoTx({ limit: 500 });

  return {
    expired,
    finalized,
    moved_to_transit: moved.moved_count ?? 0,
    moved_machine_ids: moved.machines ?? [],
  };
}

export async function getPropuestas(filters = {}) {
  const idMaquina = Number(filters?.id_maquina);

  if (Number.isInteger(idMaquina) && idMaquina > 0) {
    return findByMachineId(idMaquina);
  }

  const err = new Error("id_maquina inválido");
  err.statusCode = 400;
  throw err;
}
