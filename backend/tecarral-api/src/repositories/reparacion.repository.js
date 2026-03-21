import pool from "../config/db.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";

function buildErr(statusCode, message, meta) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.meta = meta;
  return err;
}

export async function asignarAveriaTx({ idReparacion, idUserAsignado }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const repRes = await client.query(
      `
      SELECT id_reparacion, id_maquina, estado
      FROM public.reparacion
      WHERE id_reparacion = $1
      FOR UPDATE
      `,
      [idReparacion]
    );

    if (repRes.rows.length === 0) {
      throw buildErr(404, "Reparación no encontrada", { idReparacion });
    }

    const reparacion = repRes.rows[0];

    if (reparacion.estado === "TERMINADA" || reparacion.estado === "CANCELADA") {
      throw buildErr(409, "No se puede asignar una reparación cerrada", {
        idReparacion,
        estado: reparacion.estado,
      });
    }

    const maqRes = await client.query(
      `
      SELECT id_maquina, maintenance_status
      FROM public.maquina
      WHERE id_maquina = $1
      `,
      [reparacion.id_maquina]
    );

    if (maqRes.rows.length === 0) {
      throw buildErr(404, "Máquina no encontrada", { id_maquina: reparacion.id_maquina });
    }

    const maintenanceStatus = maqRes.rows[0].maintenance_status;

    if (maintenanceStatus !== MAINTENANCE_STATUS.AVERIADA_GRAVE) {
      throw buildErr(409, "Solo se pueden asignar por admin las reparaciones de avería grave", {
        idReparacion,
        maintenance_status: maintenanceStatus,
      });
    }

    const userRes = await client.query(
      `
      SELECT id_user
      FROM public.users
      WHERE id_user = $1
      `,
      [idUserAsignado]
    );

    if (userRes.rows.length === 0) {
      throw buildErr(404, "Usuario asignado no encontrado", { idUserAsignado });
    }

    await client.query(
      `
      UPDATE public.reparacion
      SET id_user_asignado = $2
      WHERE id_reparacion = $1
      `,
      [idReparacion, idUserAsignado]
    );

    await client.query("COMMIT");

    return {
      id_reparacion: idReparacion,
      id_user_asignado: idUserAsignado,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function marcarReparacionTerminadaTx(
  idReparacion,
  solucionAplicada
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reparacionRes = await client.query(
      `
      SELECT
        r.id_reparacion,
        r.id_maquina,
        r.estado
      FROM reparacion r
      WHERE r.id_reparacion = $1
      FOR UPDATE
      `,
      [idReparacion]
    );

    if (reparacionRes.rowCount === 0) {
      throw buildErr(404, "Reparación no encontrada");
    }

    const reparacion = reparacionRes.rows[0];

    const allowedStates = [
      "PRESUPUESTO_ACEPTADO",
      "PRESUPUESTO_RECHAZADO",
      "PRESUPUESTO_EXPIRADO",
      "CREADA",
    ];

    if (!allowedStates.includes(reparacion.estado)) {
      throw buildErr(
        409,
        "La reparación no puede marcarse como TERMINADA desde su estado actual"
      );
    }

    await client.query(
      `
      UPDATE reparacion
      SET
        estado = 'TERMINADA',
        solucion_aplicada = $2
      WHERE id_reparacion = $1
      `,
      [idReparacion, solucionAplicada]
    );

    await client.query(
      `
      UPDATE maquina
      SET maintenance_status = 'OK'
      WHERE id_maquina = $1
      `,
      [reparacion.id_maquina]
    );

    await client.query("COMMIT");

    return {
      id_reparacion: reparacion.id_reparacion,
      estado_anterior: reparacion.estado,
      estado_actual: "TERMINADA",
      solucion_aplicada: solucionAplicada,
    };

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}