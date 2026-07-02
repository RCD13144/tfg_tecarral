import pool from "../config/db.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";
import { ensureEntityDocumentNumberTx } from "./formalDocument.repository.js";

function buildErr(statusCode, message, meta) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.meta = meta;
  return err;
}

const ALBARAN_SELECT_FIELDS = `
  id_albaran,
  document_number,
  document_kind,
  estado,
  firmado_at,
  id_maquina,
  propuesta_alquiler_id,
  service_context_type,
  service_context_id,
  service_case_type,
  service_visit_kind,
  pricing_mode,
  pricing_base_amount,
  includes_travel,
  estimated_work_minutes,
  hours_start,
  hours_end,
  total_hours,
  desplazamiento_text,
  delivery_address,
  delivery_phone,
  payment_terms,
  document_snapshot_html,
  created_at,
  cliente,
  direccion,
  telefono,
  poblacion,
  cp,
  email_cliente,
  marca,
  modelo,
  ns,
  observaciones
`;

export async function getAlbaranesByUser({ idUser, estado = null }) {
  const values = [idUser];
  const filters = ["id_user = $1"];

  if (estado) {
    values.push(estado);
    filters.push(`estado = $${values.length}`);
  }

  const result = await pool.query(
    `
    SELECT ${ALBARAN_SELECT_FIELDS}
    FROM public.albaran
    WHERE ${filters.join(" AND ")}
    ORDER BY
      CASE WHEN firmado_at IS NULL THEN 1 ELSE 0 END,
      firmado_at DESC NULLS LAST,
      id_albaran DESC
    `,
    values
  );

  return result.rows;
}

export async function getAlbaranDetailById({ idAlbaran, idUser }) {
  const result = await pool.query(
    `
    SELECT ${ALBARAN_SELECT_FIELDS}
    FROM public.albaran
    WHERE id_albaran = $1
      AND id_user = $2
    `,
    [idAlbaran, idUser]
  );

  if (result.rows.length === 0) {
    throw buildErr(404, "Albarán no encontrado", { idAlbaran, idUser });
  }

  return result.rows[0];
}

export async function firmarAlbaranTx({
  idAlbaran,
  idUser,
  observaciones,
  firmaCliente,
  firmaTecnico,
  firmaClienteMime,
  firmaTecnicoMime,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const albRes = await client.query(
      `
      SELECT
        id_albaran, document_number, document_kind, id_user, id_maquina,
        estado, propuesta_alquiler_id, service_context_type, service_context_id,
        service_case_type, service_visit_kind, pricing_mode, pricing_base_amount,
        includes_travel, estimated_work_minutes, hours_start, hours_end, total_hours,
        desplazamiento_text, delivery_address, delivery_phone, payment_terms,
        cliente, email_cliente, telefono, direccion, cp, poblacion, observaciones,
        created_at
      FROM public.albaran
      WHERE id_albaran = $1
      FOR UPDATE
      `,
      [idAlbaran]
    );

    if (albRes.rows.length === 0) {
      throw buildErr(404, "Albarán no encontrado", { idAlbaran });
    }

    const albaran = albRes.rows[0];

    if (albaran.estado !== "BORRADOR") {
      throw buildErr(409, "El albarán ya está firmado y no se puede modificar", {
        idAlbaran,
        estado: albaran.estado,
      });
    }

    if (Number(albaran.id_user) !== Number(idUser)) {
      throw buildErr(403, "Solo el usuario creador del albarán puede firmarlo", {
        idAlbaran,
        albaran_id_user: albaran.id_user,
        idUser,
      });
    }

    albaran.document_number = await ensureEntityDocumentNumberTx(client, {
      entityTable: "albaran",
      entityIdColumn: "id_albaran",
      entityId: idAlbaran,
      documentType: "ALBARAN",
    });

    const reparacionRes = await client.query(
      `
      SELECT id_reparacion, estado
      FROM public.reparacion
      WHERE id_albaran = $1
      ORDER BY id_reparacion DESC
      LIMIT 1
      `,
      [idAlbaran]
    );

    const maqRes = await client.query(
      `
      SELECT maintenance_status, marca, modelo, ns
      FROM public.maquina
      WHERE id_maquina = $1
      `,
      [albaran.id_maquina]
    );
    const tecnicoRes = await client.query(
      `SELECT nombre FROM public.users WHERE id_user = $1 LIMIT 1`,
      [idUser]
    );

    if (maqRes.rows.length === 0) {
      throw buildErr(404, "Máquina no encontrada para el albarán", {
        idAlbaran,
        id_maquina: albaran.id_maquina,
      });
    }

    const maquina = maqRes.rows[0];
    const reparacion = reparacionRes.rows[0] ?? null;

    if (
      reparacion &&
      reparacion.estado !== "TERMINADA" &&
      maquina.maintenance_status !== MAINTENANCE_STATUS.AVERIADA_GRAVE
    ) {
      throw buildErr(409, "No se puede firmar el albarán: la máquina debe repararse antes", {
        idAlbaran,
        id_reparacion: reparacion.id_reparacion,
        reparacion_estado: reparacion.estado,
        maintenance_status: maquina.maintenance_status,
      });
    }

    const signedRes = await client.query(
      `
      UPDATE public.albaran
      SET
        observaciones = COALESCE($2, observaciones),
        firma_cliente = $3,
        firma_tecnico = $4,
        firma_cliente_mime = COALESCE($5, firma_cliente_mime),
        firma_tecnico_mime = COALESCE($6, firma_tecnico_mime),
        estado = 'FIRMADO',
        firmado_at = NOW()
      WHERE id_albaran = $1
      RETURNING firmado_at, observaciones
      `,
      [idAlbaran, observaciones, firmaCliente, firmaTecnico, firmaClienteMime, firmaTecnicoMime]
    );

    let reparacionUpdated = false;
    if (maquina.maintenance_status === MAINTENANCE_STATUS.AVERIADA_GRAVE) {
      const repUpdate = await client.query(
        `
        UPDATE public.reparacion
        SET estado = 'PENDIENTE_PRESUPUESTO'
        WHERE id_albaran = $1
          AND estado = 'CREADA'
        RETURNING id_reparacion
        `,
        [idAlbaran]
      );
      reparacionUpdated = repUpdate.rows.length > 0;
    }

    let propuesta = {
      id: albaran.propuesta_alquiler_id ?? null,
      cliente: albaran.cliente,
      email_cliente: albaran.email_cliente,
      telefono: albaran.telefono,
      direccion: albaran.direccion,
      cp: albaran.cp,
      poblacion: albaran.poblacion,
    };

    if (albaran.propuesta_alquiler_id) {
      const propRes = await client.query(
        `
        SELECT id, cliente, email_cliente, telefono, direccion, cp, poblacion
        FROM public.propuesta_alquiler
        WHERE id = $1
        `,
        [albaran.propuesta_alquiler_id]
      );
      if (propRes.rows[0]) propuesta = propRes.rows[0];
    }

    await client.query("COMMIT");

    return {
      id_albaran: idAlbaran,
      document_number: albaran.document_number,
      document_kind: albaran.document_kind,
      estado: "FIRMADO",
      firmado: true,
      firmado_at: signedRes.rows[0]?.firmado_at ?? new Date().toISOString(),
      created_at: albaran.created_at,
      reparacion_paso_a_pendiente_presupuesto: reparacionUpdated,
      maintenance_status: maquina.maintenance_status,
      email_cliente: propuesta.email_cliente,
      cliente: propuesta.cliente,
      telefono: propuesta.telefono,
      direccion: propuesta.direccion,
      cp: propuesta.cp,
      poblacion: propuesta.poblacion,
      propuesta_alquiler_id: propuesta.id,
      id_maquina: albaran.id_maquina,
      service_context_type: albaran.service_context_type,
      service_context_id: albaran.service_context_id,
      service_case_type: albaran.service_case_type,
      service_visit_kind: albaran.service_visit_kind,
      pricing_mode: albaran.pricing_mode,
      pricing_base_amount: albaran.pricing_base_amount,
      includes_travel: albaran.includes_travel,
      estimated_work_minutes: albaran.estimated_work_minutes,
      hours_start: albaran.hours_start,
      hours_end: albaran.hours_end,
      total_hours: albaran.total_hours,
      desplazamiento_text: albaran.desplazamiento_text,
      delivery_address: albaran.delivery_address,
      delivery_phone: albaran.delivery_phone,
      payment_terms: albaran.payment_terms,
      tecnico_nombre: tecnicoRes.rows[0]?.nombre ?? null,
      maquina: {
        marca: maquina.marca,
        modelo: maquina.modelo,
        ns: maquina.ns,
      },
      contacto: {
        telefono: propuesta.telefono,
        direccion: propuesta.direccion,
        cp: propuesta.cp,
        poblacion: propuesta.poblacion,
      },
      observaciones: signedRes.rows[0]?.observaciones ?? albaran.observaciones ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
