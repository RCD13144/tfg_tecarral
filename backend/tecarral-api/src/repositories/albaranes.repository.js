import pool from "../config/db.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";

function buildErr(statusCode, message, meta) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.meta = meta;
  return err;
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
      SELECT id_albaran, id_user, id_maquina, estado, propuesta_alquiler_id
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
      throw buildErr(409, "El albarán no está en BORRADOR", {
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

    await client.query(
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
      `,
      [idAlbaran, observaciones, firmaCliente, firmaTecnico, firmaClienteMime, firmaTecnicoMime]
    );

    const maqRes = await client.query(
      `
      SELECT maintenance_status, marca, modelo, ns
      FROM public.maquina
      WHERE id_maquina = $1
      `,
      [albaran.id_maquina]
    );

    if (maqRes.rows.length === 0) {
      throw buildErr(404, "Máquina no encontrada para el albarán", {
        idAlbaran,
        id_maquina: albaran.id_maquina,
      });
    }

    const maquina = maqRes.rows[0];

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

    // Email del cliente desde propuesta_alquiler (lo que pides)
    const propRes = await client.query(
      `
      SELECT id, cliente, email_cliente, telefono, direccion, cp, poblacion
      FROM public.propuesta_alquiler
      WHERE id = $1
      `,
      [albaran.propuesta_alquiler_id]
    );

    if (propRes.rows.length === 0) {
      throw buildErr(404, "propuesta_alquiler no encontrada para el albarán", {
        idAlbaran,
        propuesta_alquiler_id: albaran.propuesta_alquiler_id,
      });
    }

    const propuesta = propRes.rows[0];

    await client.query("COMMIT");

    return {
      id_albaran: idAlbaran,
      estado: "FIRMADO",
      firmado: true,
      reparacion_paso_a_pendiente_presupuesto: reparacionUpdated,
      maintenance_status: maquina.maintenance_status,

      // datos para email
      email_cliente: propuesta.email_cliente,
      cliente: propuesta.cliente,
      propuesta_alquiler_id: propuesta.id,
      id_maquina: albaran.id_maquina,
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
      observaciones: observaciones ?? null,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}